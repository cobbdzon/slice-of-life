import { randomUUID } from "crypto";
import { Hono } from "hono";
import { getUserFromContext } from "../db/queries/auth";
import { validateTokenFromContext } from "./cookies";
import { type JournalAsset, type User } from "../db/schema";
import { deleteJournalAssets, getJournalAssetsWithMissingFile, getOrphanedImagesFilenamesOnDisk, getOrphanedJournalAssets, insertJournalAsset } from "../db/queries/uploads";
import { mkdir, rename } from "fs/promises";
import { env } from "./env";
import { logger } from "./logger";
import { sanitizeImageUpload, toSafeUploadFilename } from "./imageProcessing";

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

  if (file.size > MAX_UPLOAD_FILE_SIZE) {
    return c.json({ message: "FILE_TOO_BIG" }, 413);
  }

  // Fully re-encode the upload as a clean raster image before it ever reaches
  // disk. The bytes stored are sharp's output (metadata-stripped, bounded), so
  // no client-controlled payload can survive into storage. If the input cannot
  // be decoded and re-encoded as an image, it is rejected outright.
  let sanitized: { buffer: Buffer; extension: string };
  try {
    sanitized = await sanitizeImageUpload(Buffer.from(await file.arrayBuffer()));
  } catch (error) {
    logger.info(`upload rejected: not a decodable image (${(error as Error).message})`);
    return c.json({ message: "UNSUPPORTED_FILE" }, 415);
  }

  const assetId = randomUUID();
  const filename = `${assetId}.${sanitized.extension}`;
  const destination = `${env.UPLOAD_DIR}${filename}`;
  const publicUrlPath = `${env.UPLOAD_URL_PREFIX}${filename}`;

  // Write to a temp file, then atomically rename into place so no partially
  // written or mid-failure file is ever visible in the upload directory.
  const tempDestination = `${destination}.tmp-${Date.now()}`;
  await Bun.write(tempDestination, sanitized.buffer);

  try {
    const newUpload: JournalAsset = {
      id: assetId,
      userId: user.id,
      serverPath: publicUrlPath,
      originalName: file.name,
      fileSize: sanitized.buffer.length
    }

    await insertJournalAsset(newUpload);
  } catch (error) {
    logger.error(`upload DB insert failed: ${(error as Error).message}`);
    await Bun.file(tempDestination).delete().catch(() => {});
    return c.json({ message: "Could not save file asset information" }, 500);
  }

  await rename(tempDestination, destination).catch(async (error) => {
    logger.error(`upload rename failed: ${(error as Error).message}`);
    await Bun.file(tempDestination).delete().catch(() => {});
    throw error;
  });

  return c.json({ url: publicUrlPath });
});

export async function startGarbageCollectionLoop() {
  if (env.GARBAGE_COLLECT_INTERVAL === 0) {
    logger.warn("GC interval is 0, skipping")
    return;
  }

  // check if uploads directory exists
  await mkdir(env.UPLOAD_DIR, { recursive: true });
  await Bun.sleep(5000); // some delay

  while (true) {
    try {
      // assets with no file
      const assetsWithMissingFile = await getJournalAssetsWithMissingFile();
      // console.log("Missing file: ", assetsWithMissingFile.map(asset => asset.originalName));
      await deleteJournalAssets(assetsWithMissingFile); // no file

      // assets with no parent entry, that is not stale
      const assetsOrphaned = (await getOrphanedJournalAssets()).filter(asset => {
        const createdAtMs = asset.createdAt ? new Date(asset.createdAt).getTime() : NaN;
        const isStale = !Number.isFinite(createdAtMs) || (Date.now() - createdAtMs > STALE_THRESHOLD_MS);
        return isStale;
      });
      // console.log("Does not belong to any entry: ", assetsOrphaned.map(asset => asset.originalName));
      await deleteJournalAssets(assetsOrphaned, true) // no entry

      // delete files that have no entry in the database, that is not stale
      const imagesFilenamesOrphaned = (await getOrphanedImagesFilenamesOnDisk()).filter(filename => {
        return filename !== ".gitkeep";
      });

      // console.log("Orphaned file with no database entry: ", imagesFilenamesOrphaned);
      for (const filename of imagesFilenamesOrphaned) {
        const filePath = `${env.UPLOAD_DIR}${filename}`;
        const file = Bun.file(filePath);

        if (await file.exists()) {
          const isStale = Date.now() - file.lastModified > STALE_THRESHOLD_MS;
          if (isStale) {
            logger.debug(`GC deleting: ${filename}`);
            await file.delete();
          }
        }
      }
    } catch (err) {
      logger.error(`GC error: ${(err as Error).message}`);
    }

    await Bun.sleep(GARBAGE_COLLECT_INTERVAL);
  }
}

export default app;
