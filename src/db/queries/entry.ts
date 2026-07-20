import { db } from "../db";
import * as schema from "../schema";
import { eq } from "drizzle-orm";

async function insertJournalEntry(userId: number, journalEntry: schema.JournalEntry) {
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

async function getJournalEntries(userId: number): Promise<schema.JournalEntry[]> {
  const rows = await db.select().from(schema.entries).where(eq(schema.entries.userId, userId));

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    note: row.note,
    imagePaths: row.imagePaths,
    date: new Date(row.date),
  }));
}
