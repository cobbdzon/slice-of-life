import { Hono } from 'hono';
import { type JournalEntry } from '../db/schema';
export type JournalEntryNullable = JournalEntry | null;

export const app = new Hono();

export type MonthGroup = {
  monthName: string;
  year: number;
  journalEntries: JournalEntryNullable[];
}

export function getMonthNames(locale: string = 'en-US'): string[] {
  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(2026, index, 1); // year doesnt matter
    return date.toLocaleDateString(locale, { month: 'long' });
  });
}

export function getDaysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

export function dateToString(date: Date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function stringToDate(dateString: string) {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year as number, (month as number - 1), (day ? day + 1 : 0) as number);
}

export function validateRequestedYear(yearInput: string | null | undefined): number {
  const currentYear = new Date().getFullYear();
  const minYear = 1975;

  if (!yearInput) {
    return currentYear;
  }

  const parsedYear = parseInt(yearInput, 10);

  if (
    Number.isNaN(parsedYear) ||
    parsedYear < minYear ||
    parsedYear > currentYear
  ) {
    return currentYear;
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
