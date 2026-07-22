import { eq, inArray } from "drizzle-orm";
import { db } from "../db";
import * as schema from "../schema";
import { readdir } from "fs/promises";
// import { and, eq, inArray } from "drizzle-orm";

export async function insertJournalAsset(journalAsset: schema.JournalAsset) {
  return await db.insert(schema.journalAssets).values(journalAsset).returning();
}

export async function getJournalAssets(userId: number): Promise<schema.JournalAsset[]> {
  return await db.select().from(schema.journalAssets).where(
    eq(schema.journalAssets.userId, userId)
  )
}

export async function getUserTotalFilesSize(userId: number) {
  const userUploadSizes = (await getJournalAssets(userId)).map(upload => upload.fileSize);
  if (userUploadSizes.length == 0) {
    return 0;
  }
  return userUploadSizes.reduce((acc, val) => acc + val, 0);
}

export async function getJournalAssetsWithMissingFile(): Promise<schema.JournalAsset[]> {
  const allAssets = await db.select().from(schema.journalAssets);
  const missingAssets = [];

  for (const asset of allAssets) {
    const filename = asset.serverPath.split("/").pop();
    const exists = await Bun.file(`./public/uploads/${filename}`).exists();
    if (!exists) {
      missingAssets.push(asset);
    }
  }

  return missingAssets;
}

export async function getOrphanedJournalAssets(): Promise<schema.JournalAsset[]> {
  const entries = await db
    .select()
    .from(schema.journalEntries);

  const activeAssetFilenames = entries.flatMap(entry => {
    return entry.imagePaths;
  }).map(imagePath => {
    return imagePath.split("/").pop();
  })

  const assets = await db.select().from(schema.journalAssets);

  return assets.filter(asset => {
    const filename = asset.serverPath.split("/").pop()
    return !activeAssetFilenames.includes(filename)
  });
}

export async function getOrphanedImagesFilenamesOnDisk() {
  const entries = await readdir("./public/uploads", { withFileTypes: true });
  const filenames = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name);

  const assetFilenames = (await db.select().from(schema.journalAssets)).map(asset => {
    return (asset.serverPath).split("/").pop() || ""
  })

  const dbSet = new Set(
    assetFilenames.map((asset) => asset.split("/").pop())
  );

  return filenames.filter((filename) => !dbSet.has(filename));
}

export async function deleteJournalAssets(assetsToDelete: schema.JournalAsset[], deleteFilesFromDisk = false): Promise<number> {
  if (!assetsToDelete || assetsToDelete.length === 0) {
    return 0;
  }

  const idsToDelete = assetsToDelete.map((asset) => asset.id);

  if (idsToDelete.length === 0) {
    return 0;
  }

  await db
    .delete(schema.journalAssets)
    .where(inArray(schema.journalAssets.id, idsToDelete));

  if (deleteFilesFromDisk) {
    await Promise.all(
      assetsToDelete.map(async (asset) => {
        const file = Bun.file(`.${asset.serverPath}`);
        if (await file.exists()) {
          await file.delete();
        }
      })
    );
  }

  return idsToDelete.length;
}
