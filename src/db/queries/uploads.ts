import { eq, inArray } from "drizzle-orm";
import { db } from "../db";
import { journalAssets, journalEntries, type JournalAsset } from "../schema";
import { readdir } from "fs/promises";
// import { and, eq, inArray } from "drizzle-orm";

export async function insertJournalAsset(asset: JournalAsset) {
  return await db.insert(journalAssets).values(asset).returning();
}

export async function getJournalAssets(userId: number): Promise<JournalAsset[]> {
  return await db.select().from(journalAssets).where(
    eq(journalAssets.userId, userId)
  )
}

export async function getUserTotalFilesSize(userId: number) {
  const userUploadSizes = (await getJournalAssets(userId)).map(upload => upload.fileSize);
  if (userUploadSizes.length == 0) {
    return 0;
  }
  return userUploadSizes.reduce((acc, val) => acc + val, 0);
}

export async function getJournalAssetsWithMissingFile(): Promise<JournalAsset[]> {
  const allAssets = await db.select().from(journalAssets);
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

export async function getOrphanedJournalAssets(): Promise<JournalAsset[]> {
  const entries = await db
    .select()
    .from(journalEntries);

  const activeAssetFilenames = entries.flatMap(entry => {
    return entry.imagePaths;
  }).map(imagePath => {
    return imagePath.split("/").pop();
  })

  const assets = await db.select().from(journalAssets);

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

  const assetFilenames = (await db.select().from(journalAssets)).map(asset => {
    return (asset.serverPath).split("/").pop() || ""
  })

  const dbSet = new Set(
    assetFilenames.map((asset) => asset.split("/").pop())
  );

  return filenames.filter((filename) => !dbSet.has(filename));
}

export async function deleteJournalAssets(assetsToDelete: JournalAsset[], deleteFilesFromDisk = false): Promise<number> {
  if (!assetsToDelete || assetsToDelete.length === 0) {
    return 0;
  }

  const idsToDelete = assetsToDelete.map((asset) => asset.id);

  if (idsToDelete.length === 0) {
    return 0;
  }

  await db
    .delete(journalAssets)
    .where(inArray(journalAssets.id, idsToDelete));

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
