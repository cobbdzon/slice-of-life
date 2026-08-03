import { randomUUID } from "crypto";
import { Hono } from "hono";
import { getUserFromContext } from "../db/queries/auth";
import { validateTokenFromContext } from "./cookies";
import { type JournalAsset, type User } from "../db/schema";
import { deleteJournalAssets, getJournalAssetsWithMissingFile, getOrphanedImagesFilenamesOnDisk, getOrphanedJournalAssets, insertJournalAsset } from "../db/queries/uploads";
import { mkdir } from "fs/promises";
import { env } from "./env";

const MAX_UPLOAD_FILE_SIZE = env.MAX_UPLOAD_FILE_SIZE * 1024 * 1024;
const GARBAGE_COLLECT_INTERVAL = env.GARBAGE_COLLECT_INTERVAL * 60 * 1000;
const STALE_THRESHOLD_MS = env.UPLOAD_FILE_STALE_THRESHOLD * 60 * 1000;

const app = new Hono();

export function getFilenameFromUrlPath(urlPath: string) {
  return urlPath.split("/").pop();
}

// TODO: move to an api file that declares api paths that can access select env variables?
// /api/max_upload_file_size
app.get("/max_upload_file_size", async (c) => {
  const isValidToken = await validateTokenFromContext(c);
  if (!isValidToken) {
    return c.status(401);
  }
  return c.json({
    MAX_UPLOAD_FILE_SIZE: MAX_UPLOAD_FILE_SIZE,
  })
})

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

  if (file.size > MAX_UPLOAD_FILE_SIZE) {
    return c.json({ message: "FILE_TOO_BIG" }, 413);
  }

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
  if (env.GARBAGE_COLLECT_INTERVAL == 0) {
    return console.warn("Attempted to start garbage collection when interval is set to 0!")
  }

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
