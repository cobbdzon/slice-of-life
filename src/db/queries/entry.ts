import { db } from "../db";
import { and, eq, inArray } from "drizzle-orm";
import { journalEntries, type DBJournalEntry, type JournalEntry } from "../schema";

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

// TODO: check if imagePaths still exists and update if deleted
export async function getJournalEntries(userId: number): Promise<JournalEntry[]> {
  const rows = await db.select().from(journalEntries).where(eq(journalEntries.userId, userId));

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    note: row.note,
    imagePaths: row.imagePaths,
    date: new Date(row.date),
  }));
}

export async function getJournalEntriesFromDate(date: Date): Promise<JournalEntry[]> {
  const rows = (await db.select().from(journalEntries)).filter(entry => {
    return (entry.date.split("T")[0] == date.toISOString().split("T")[0]);
  })

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
