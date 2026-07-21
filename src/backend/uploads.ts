import { randomUUID } from "crypto";
import { Hono } from "hono";
import { getUserFromContext } from "../db/queries/auth";
import { validateTokenFromContext } from "./cookies";
import { type JournalAsset, type User } from "../db/schema";
import { deleteJournalAssets, getJournalAssets, getJournalAssetsWithMissingFile, getOrphanedImagesFilenamesOnDisk, getOrphanedJournalAssets, insertJournalAsset } from "../db/queries/uploads";
import { mkdir } from "fs/promises";

export const MAX_FILE_SIZE = 5 * 1024 * 1024;
// const GARBAGE_COLLECT_INTERVAL = 30 * 60 * 1000; // 30 mins
// const STALE_THRESHOLD_MS = 60 * 60 * 1000; // 1 hr
const GARBAGE_COLLECT_INTERVAL = 5000; // 30 mins
const STALE_THRESHOLD_MS = 20000; // 1 hr


const app = new Hono();

export function getFilenameFromUrlPath(urlPath: string) {
  return urlPath.split("/").pop();
}

app.post("/upload", async (c) => {
  const isValidToken = await validateTokenFromContext(c);
  if (!isValidToken) {
    return c.redirect("/login");
  }

  const user = await getUserFromContext(c) as User;

  const body = await c.req.parseBody();
  const file = body["image"] as File;

  if (!file) return c.json({ message: "No file received" }, 400);

  const assetId = randomUUID();
  const fileExtension = file.name.split(".").pop();
  const filename = `${assetId}.${fileExtension}`;
  const destination = `./public/uploads/${filename}`;
  const publicUrlPath = `/static/uploads/${filename}`;

  if (file.size > MAX_FILE_SIZE) {
    return c.json({ message: "FILE_TOO_BIG" }, 413);
  }

  // TODO: give files age unless they start belonging to an entry
  await Bun.write(destination, file);

  try {
    const newUpload: JournalAsset = {
      id: assetId,
      userId: user.id,
      serverPath: publicUrlPath,
      originalName: file.name,
      fileSize: file.size
    }

    await insertJournalAsset(newUpload);
  } catch (error) {
    console.error("Database tracking inventory crash: ", error);
    return c.json({ message: "Could not save file asset information" }, 500);
  }

  return c.json({ url: publicUrlPath });
});

export async function startGarbageCollectionLoop() {
  // check if uploads directory exists
  await mkdir("./public/uploads", { recursive: true });
  await Bun.sleep(5000); // some delay

  while (true) {
    try {
      // assets with no file
      const assetsWithMissingFile = await getJournalAssetsWithMissingFile();
      // console.log("Missing file: ", assetsWithMissingFile.map(asset => asset.originalName));
      await deleteJournalAssets(assetsWithMissingFile); // no file

      // assets with no parent entry, that is not stale
      const assetsOrphaned = (await getOrphanedJournalAssets()).filter(asset => {
        const isStale = Date.now() - new Date(asset.createdAt as string).getTime() > STALE_THRESHOLD_MS;
        return isStale;
      });
      // console.log("Does not belong to any entry: ", assetsOrphaned.map(asset => asset.originalName));
      await deleteJournalAssets(assetsOrphaned, true) // no entry

      // delete files that have no entry in the database, that is not stale
      const imagesFilenamesOrphaned = (await getOrphanedImagesFilenamesOnDisk()).filter(filename => {
        return filename != ".gitkeep";
      });

      // console.log("Orphaned file with no database entry: ", imagesFilenamesOrphaned);
      for (const filename of imagesFilenamesOrphaned) {
        const filePath = `./public/uploads/${filename}`;
        const file = Bun.file(filePath);

        if (await file.exists()) {
          const isStale = Date.now() - file.lastModified > STALE_THRESHOLD_MS;
          if (isStale) {
            console.log(`Deleting ${filename}`);
            await file.delete();
          }
        }
      }
    } catch (err) {
      console.error("Garbage collection error:", err);
    }

    await Bun.sleep(GARBAGE_COLLECT_INTERVAL);
  }
}

export default app;
