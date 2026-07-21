import { inArray } from "drizzle-orm";
import { db } from "../db";
import * as schema from "../schema";
import { readdir } from "fs/promises";
// import { and, eq, inArray } from "drizzle-orm";

export async function insertJournalAsset(journalAsset: schema.JournalAsset) {
  return await db.insert(schema.journalAssets).values(journalAsset);
}

export async function getJournalAssetsWithMissingFile(): Promise<schema.JournalAsset[]> {
  const allAssets = await db.select().from(schema.journalAssets);
  const missingAssets = [];

  for (const asset of allAssets) {
    const exists = await Bun.file(asset.serverPath).exists();
    if (!exists) {
      missingAssets.push(asset);
    }
  }

  return missingAssets;
}

export async function deleteJournalAssetsWithMissingFile(missingAssets: schema.JournalAsset[]) {
  if (missingAssets.length === 0) return 0;

  const idsToDelete = missingAssets.map((asset) => asset.id);
  await db.delete(schema.journalAssets).where(inArray(schema.journalAssets.id, idsToDelete));

  return idsToDelete.length;
}

export async function getOrphanedJournalAssets(): Promise<schema.JournalAsset[]> {
  const entries = await db
    .select({ imagePaths: schema.journalEntries.imagePaths })
    .from(schema.journalEntries);

  const activePathsSet = new Set(
    entries.flatMap((entry) => entry.imagePaths ?? [])
  );

  const assets = await db.select().from(schema.journalAssets);

  return assets.filter((asset) => !activePathsSet.has(asset.serverPath));
}

export async function deleteOrphanedJournalAssets(orphanedAssets: schema.JournalAsset[]) {
  if (orphanedAssets.length === 0) return 0;

  const idsToDelete = orphanedAssets.map((asset) => asset.id);

  await db.delete(schema.journalAssets).where(inArray(schema.journalAssets.id, idsToDelete));

  await Promise.all(
    orphanedAssets.map(async (asset) => {
      const file = Bun.file(asset.serverPath);
      if (await file.exists()) {
        await file.delete();
      }
    })
  );

  return idsToDelete.length;
}

export async function getOrphanedImagesFilenamesOnDisk() {
  const entries = await readdir("./public/uploads", { withFileTypes: true });
  const filenames = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name);

  const assets = (await db
    .select({ serverPath: schema.journalAssets.serverPath })
    .from(schema.journalAssets));

  const dbSet = new Set(
    assets.map((asset) => asset.serverPath.split("/").pop())
  );

  return filenames.filter((filename) => !dbSet.has(filename));
}
