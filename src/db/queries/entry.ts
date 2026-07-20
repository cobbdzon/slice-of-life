import { db } from "../db";
import * as schema from "../schema";
import { and, eq } from "drizzle-orm";

export async function insertJournalEntry(userId: number, journalEntry: schema.JournalEntry) {
  const newRow: schema.DBJournalEntry = {
    id: journalEntry.id,
    title: journalEntry.title,
    note: journalEntry.note,
    date: journalEntry.date.toISOString(),
    imagePaths: journalEntry.imagePaths,

    // define who owns the entry
    userId: userId,
  };

  return await db.insert(schema.journalEntries).values(newRow);
}

export async function getJournalEntries(userId: number): Promise<schema.JournalEntry[]> {
  const rows = await db.select().from(schema.journalEntries).where(eq(schema.journalEntries.userId, userId));

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    note: row.note,
    imagePaths: row.imagePaths,
    date: new Date(row.date),
  }));
}

export async function getJournalEntryFromEntryId(userId: number, entryId: String): Promise<schema.JournalEntry | null> {
  const journalEntries = await getJournalEntries(userId);
  const matchedEntries = journalEntries.filter(entry => {
    return entry.id == entryId;
  })
  const rawJournalEntry = matchedEntries.pop();
  if (!rawJournalEntry) {
    return null;
  }
  const journalEntry: schema.JournalEntry = {
    id: rawJournalEntry.id,
    title: rawJournalEntry.title,
    note: rawJournalEntry.note,
    imagePaths: rawJournalEntry.imagePaths,
    date: new Date(rawJournalEntry.date),
    userId: userId
  }
  return journalEntry
}

export async function updateJournalEntry(userId: number, journalEntry: schema.JournalEntry) {
  const updatedRow = {
    title: journalEntry.title,
    note: journalEntry.note,
    date: journalEntry.date.toISOString(),
    imagePaths: journalEntry.imagePaths,
  };

  return await db
    .update(schema.journalEntries)
    .set(updatedRow)
    .where(
      and(
        eq(schema.journalEntries.id, journalEntry.id),
        eq(schema.journalEntries.userId, userId)
      )
    );
}

export async function updateMultipleJournalEntries(userId: number, journalEntries: schema.JournalEntry[]) {
  // db.transaction opens a single transaction pipeline
  return await db.transaction(async (tx) => {
    for (const entry of journalEntries) {
      await tx
        .update(schema.journalEntries)
        .set({
          title: entry.title,
          note: entry.note,
          date: entry.date.toISOString(),
          imagePaths: entry.imagePaths,
        })
        .where(
          and(
            eq(schema.journalEntries.id, entry.id),
            eq(schema.journalEntries.userId, userId)
          )
        );
    }
  });
}
