import { db } from "../db";
import { and, eq, inArray, like } from "drizzle-orm";
import { journalAssets, journalEntries, type DBJournalEntry, type JournalEntry } from "../schema";

export async function insertJournalEntry(userId: number, journalEntry: JournalEntry) {
  const newRow: DBJournalEntry = {
    id: journalEntry.id,
    title: journalEntry.title,
    note: journalEntry.note,
    date: journalEntry.date.toISOString(),
    imagePaths: journalEntry.imagePaths,

    // define who owns the entry
    userId: userId,
  };

  return await db.insert(journalEntries).values(newRow);
}

export type JournalEntriesFilter = {
  year?: number;
  month?: number; // 0-based, like Date.getMonth()
};

// TODO: check if imagePaths still exists and update if deleted
export async function getJournalEntries(userId: number, filter: JournalEntriesFilter = {}): Promise<JournalEntry[]> {
  const conditions = [eq(journalEntries.userId, userId)];

  if (filter.year !== undefined) {
    conditions.push(like(journalEntries.date, `${filter.year}-%`));
    if (filter.month !== undefined) {
      const monthStr = (filter.month + 1).toString().padStart(2, "0");
      conditions.push(like(journalEntries.date, `${filter.year}-${monthStr}-%`));
    }
  }

  const rows = await db.select()
    .from(journalEntries)
    .where(and(...conditions))
    .orderBy(journalEntries.date);

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    note: row.note,
    imagePaths: row.imagePaths,
    date: new Date(row.date),
  }));
}

export async function getJournalEntriesFromDate(userId: number, date: Date): Promise<JournalEntry[]> {
  const dateStr = date.toISOString().split("T")[0]!;
  const rows = await db.select().from(journalEntries).where(
    and(
      eq(journalEntries.userId, userId),
      eq(journalEntries.date, dateStr)
    )
  );

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    note: row.note,
    imagePaths: row.imagePaths,
    date: new Date(row.date),
  }));
}

export async function getJournalEntryFromEntryId(userId: number, entryId: string): Promise<JournalEntry | null> {
  const rows = await db.select()
    .from(journalEntries)
    .where(
      and(
        eq(journalEntries.id, entryId),
        eq(journalEntries.userId, userId)
      )
    );

  const matchedEntries: JournalEntry[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    note: row.note,
    imagePaths: row.imagePaths,
    date: new Date(row.date),
    userId: row.userId
  }))

  return matchedEntries.pop() || null;
}

export async function updateJournalEntry(userId: number, entry: JournalEntry) {
  const updatedRow = {
    title: entry.title,
    note: entry.note,
    date: entry.date.toISOString(),
    imagePaths: entry.imagePaths,
  };

  return await db
    .update(journalEntries)
    .set(updatedRow)
    .where(
      and(
        eq(journalEntries.id, entry.id),
        eq(journalEntries.userId, userId)
      )
    );
}

// Atomically remove assets and update the entry. Rolls back both if the update fails,
// so removed assets are never lost while the old entry still references them.
export async function updateJournalEntryWithRemovedAssets(
  userId: number,
  entry: JournalEntry,
  removedAssetIds: string[]
) {
  return await db.transaction(async (tx) => {
    await tx
      .update(journalEntries)
      .set({
        title: entry.title,
        note: entry.note,
        date: entry.date.toISOString(),
        imagePaths: entry.imagePaths,
      })
      .where(
        and(
          eq(journalEntries.id, entry.id),
          eq(journalEntries.userId, userId)
        )
      );

    if (removedAssetIds.length > 0) {
      await tx
        .delete(journalAssets)
        .where(inArray(journalAssets.id, removedAssetIds));
    }
  });
}

export async function updateMultipleJournalEntries(userId: number, entries: JournalEntry[]) {
  // db.transaction opens a single transaction pipeline
  return await db.transaction(async (tx) => {
    for (const entry of entries) {
      await tx
        .update(journalEntries)
        .set({
          title: entry.title,
          note: entry.note,
          date: entry.date.toISOString(),
          imagePaths: entry.imagePaths,
        })
        .where(
          and(
            eq(journalEntries.id, entry.id),
            eq(journalEntries.userId, userId)
          )
        );
    }
  });
}

export async function deleteJournalEntry(userId: number, entryId: string) {
  return await db
    .delete(journalEntries)
    .where(
      and(
        eq(journalEntries.id, entryId),
        eq(journalEntries.userId, userId)
      )
    );
}

// Atomically delete the entry and its assets. Rolls back both if the entry delete
// fails, so the entry never references assets that no longer exist.
export async function deleteJournalEntryWithAssets(userId: number, entryId: string, assetIds: string[]) {
  return await db.transaction(async (tx) => {
    if (assetIds.length > 0) {
      await tx
        .delete(journalAssets)
        .where(inArray(journalAssets.id, assetIds));
    }

    await tx
      .delete(journalEntries)
      .where(
        and(
          eq(journalEntries.id, entryId),
          eq(journalEntries.userId, userId)
        )
      );
  });
}

export async function deleteMultipleJournalEntries(userId: number, entryIds: string[]) {
  if (entryIds.length === 0) return;

  // No loops! Drops thousands of rows in a single DB cycle
  return await db
    .delete(journalEntries)
    .where(
      and(
        inArray(journalEntries.id, entryIds),
        eq(journalEntries.userId, userId)
      )
    );
}
