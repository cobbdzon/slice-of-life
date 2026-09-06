import { Hono } from 'hono';
import { type JournalEntry } from '../db/schema';
export type JournalEntryNullable = JournalEntry | null;

export const app = new Hono();

export type MonthGroup = {
  monthName: string;
  year: number;
  journalEntries: JournalEntryNullable[];
}

// Date convention: a `Date` is an instant. A calendar date (YYYY-MM-DD) is
// parsed as UTC-noon so it never shifts with timezone; reads recover the
// calendar day via UTC getters, and writes store toISOString().
export function getMonthNames(locale: string = 'en-US'): string[] {
  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(Date.UTC(2026, index, 1)); // year doesnt matter
    return date.toLocaleDateString(locale, { month: 'long', timeZone: 'UTC' });
  });
}

export function getDaysInMonth(year: number, monthIndex: number) {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

export function dateToString(date: Date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function dateToStringUTC(date: Date) {
  const year = date.getUTCFullYear();
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = date.getUTCDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function stringToDate(dateString: string) {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(Date.UTC(year as number, (month as number) - 1, day as number));
}

export function validateRequestedYear(yearInput: string | null | undefined): number | null {
  const currentYear = new Date().getFullYear();
  const minYear = 1975;

  if (!yearInput) {
    return null;
  }

  const parsedYear = parseInt(yearInput, 10);

  if (
    Number.isNaN(parsedYear) ||
    parsedYear < minYear ||
    parsedYear > currentYear
  ) {
    return null;
  }

  return parsedYear;
}

export function getDefaultEntry(): JournalEntry {
  return {
    id: "null",
    date: new Date(),
    title: "Entry not found",
    note: "Entry not found",
    imagePaths: [],
  }
}

export default app;
