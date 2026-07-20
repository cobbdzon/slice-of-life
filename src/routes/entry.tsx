import { Hono } from "hono";
import { validateTokenFromContext } from "../backend/cookies";
import { getUserFromContext } from "../db/queries/auth";

import { getDefaultEntry, validateRequestedYear } from "../backend/entry";
import { entryValidator } from "../schemas/entry";
import type { JournalEntry, User } from "../db/schema";

import { DashboardPage } from '../pages/Dashboard';
import { EntryPage } from "../pages/Entry";
import { EntryEditor } from "../pages/EntryEditor";

const app = new Hono();

// TODO: MAKE ENTRY CREATION AND EDITOR
const mockEntries: JournalEntry[] = [
  {
    id: "e1",
    date: new Date("2026-07-15"),
    title: "Coffee at San Mateo cafe",
    note: "Tried the new nitro cold brew. Very smooth.",
    imagePaths: ["/static/assets/images/coffee.jpg"]
  },
  {
    id: "e2",
    date: new Date("2026-07-13"),
    title: "Calabarzon Roadtrip Walk",
    note: "Sunny afternoon walk along the ridge line.",
    imagePaths: ["/static/assets/images/road.png"]
  },
  {
    id: "e3",
    date: new Date("2026-06-28"),
    title: "Finished project milestone",
    note: "Finally pushed the working UI architecture live today.",
    imagePaths: []
  },
  {
    id: "e4",
    date: new Date("2026-06-25"),
    title: "Rainy evening music session",
    note: "Listened to some lo-fi vinyl ambient records while tracking rain outside.",
    imagePaths: ["/static/assets/images/rain.jpg", "/static/assets/images/road.png"]
  }
];

app.get('/', async (c) => {
  const isValidToken = await validateTokenFromContext(c);
  if (!isValidToken) {
    return c.redirect("/login");
  }

  const user = await getUserFromContext(c) as User;

  const currentYear = validateRequestedYear(c.req.query("year"));
  const hideEmpty = c.req.query('hideEmpty') === 'true';

  return c.html(
    <DashboardPage user={user} currentYear={currentYear} journalEntries={mockEntries} hideEmptyDays={hideEmpty} />
  );
});

app.get("/entry/:year/:month/:day", entryValidator, async (c) => {
  const isValidToken = await validateTokenFromContext(c);
  if (!isValidToken) {
    return c.redirect("/login");
  }

  const user = await getUserFromContext(c) as User;

  const { year, month, day } = c.req.valid("param");
  // const parsedDate = new Date(year, month - 1, day);

  const defaultEntry = getDefaultEntry();

  // TODO: SUPPORT MULTIPLE ENTRIES FOR THE SAME DATE?
  const journalEntries: JournalEntry[] = mockEntries.filter((journalEntry) => {
    const sameYear = journalEntry.date.getFullYear() === year;
    const sameMonth = journalEntry.date.getMonth() === (month - 1);
    const sameDay = journalEntry.date.getDate() === day;
    return sameYear && sameMonth && sameDay;
  });

  if (journalEntries.length === 0) {
    journalEntries[0] = defaultEntry;
  }

  return c.html(
    <EntryPage user={user} dateString={c.req.query("date") || ""} journalEntry={journalEntries[0]}>
    </EntryPage>
  )
})

app.get("/entry/new", async (c) => {
  const isValidToken = await validateTokenFromContext(c);
  if (!isValidToken) {
    return c.redirect("/login");
  }

  const user = await getUserFromContext(c) as User;

  return c.html(
    <EntryEditor user={user}>
    </EntryEditor>
  )
})

export default app;
