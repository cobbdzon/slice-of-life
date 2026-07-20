import { db } from "../db";
import * as schema from "../schema";
import { and, eq } from "drizzle-orm";

export async function insertJournalEntry(userId: number, journalEntry: schema.JournalEntry) {
  const newRow = {
    id: journalEntry.id,
    title: journalEntry.title,
    note: journalEntry.note,
    date: journalEntry.date.toISOString(),
    imagePaths: journalEntry.imagePaths,

    // define who owns the entry
    userId: userId,
  };

  await db.insert(schema.entries).values(newRow);
}

export async function getJournalEntries(userId: number): Promise<schema.JournalEntry[]> {
  const rows = await db.select().from(schema.entries).where(eq(schema.entries.userId, userId));

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    note: row.note,
    imagePaths: row.imagePaths,
    date: new Date(row.date),
  }));
}

export async function updateJournalEntry(userId: number, journalEntry: schema.JournalEntry): Promise<void> {
  const updatedRow = {
    title: journalEntry.title,
    note: journalEntry.note,
    date: journalEntry.date.toISOString(),
    imagePaths: journalEntry.imagePaths,
  };

  await db
    .update(schema.entries)
    .set(updatedRow)
    .where(
      and(
        eq(schema.entries.id, journalEntry.id),
        eq(schema.entries.userId, userId)
      )
    );
}

export async function updateMultipleJournalEntries(userId: number, journalEntries: schema.JournalEntry[]) {
  // db.transaction opens a single transaction pipeline
  await db.transaction(async (tx) => {
    for (const entry of journalEntries) {
      await tx
        .update(schema.entries)
        .set({
          title: entry.title,
          note: entry.note,
          date: entry.date.toISOString(),
          imagePaths: entry.imagePaths,
        })
        .where(
          and(
            eq(schema.entries.id, entry.id),
            eq(schema.entries.userId, userId)
          )
        );
    }
  });
}
