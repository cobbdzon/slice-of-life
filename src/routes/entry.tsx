import { Hono } from "hono";
import { validateTokenFromContext } from "../backend/cookies";
import { getUserFromContext } from "../db/queries/auth";

import { dateToString, getDefaultEntry, stringToDate, validateRequestedYear } from "../backend/entry";
import { entryQueryValidator } from "../schemas/entryQuery";
import type { JournalEntry, User } from "../db/schema";

import { DashboardPage } from '../pages/Dashboard';
import { EntryPage } from "../pages/Entry";
import { EntryEditor } from "../pages/EntryEditor";
import { entryPayloadValidator } from "../schemas/entryPayload";
import { getJournalEntries, getJournalEntryFromEntryId, insertJournalEntry, updateJournalEntry } from "../db/queries/entry";
import { randomUUID } from "crypto";

const app = new Hono();

app.get('/', async (c) => {
  const isValidToken = await validateTokenFromContext(c);
  if (!isValidToken) {
    return c.redirect("/login");
  }

  const user = await getUserFromContext(c) as User;
  const hideEmpty = c.req.query('hideEmpty') === 'true';

  const journalEntries = await getJournalEntries(user.id);

  return c.html(
    <DashboardPage user={user} journalEntries={journalEntries} hideEmptyDays={hideEmpty} />
  );
});

app.get("/entry/:year/:month/:day", entryQueryValidator, async (c) => {
  const isValidToken = await validateTokenFromContext(c);
  if (!isValidToken) {
    return c.redirect("/login");
  }

  const user = await getUserFromContext(c) as User;
  const { year, month, day } = c.req.valid("param");
  // const parsedDate = new Date(year, month - 1, day);

  const defaultEntry = getDefaultEntry();
  const journalEntries = await getJournalEntries(user.id)

  // TODO: SUPPORT MULTIPLE ENTRIES FOR THE SAME DATE?
  const requestedEntries: JournalEntry[] = journalEntries.filter((journalEntry) => {
    const sameYear = journalEntry.date.getFullYear() === year;
    const sameMonth = journalEntry.date.getMonth() === (month - 1);
    const sameDay = journalEntry.date.getDate() === day;
    return sameYear && sameMonth && sameDay;
  });

  if (requestedEntries.length === 0) {
    requestedEntries[0] = defaultEntry;
  }

  return c.html(
    <EntryPage user={user} dateString={c.req.query("date") || ""} journalEntry={requestedEntries.pop()}>
    </EntryPage>
  )
})

app.get("/entry/new", async (c) => {
  const isValidToken = await validateTokenFromContext(c);
  if (!isValidToken) {
    return c.redirect("/login");
  }

  const user = await getUserFromContext(c) as User;

  // check and validate date query
  const dateParam = c.req.query("date") || "";
  const parsedDate = stringToDate(dateParam)

  if (!parsedDate.getDate()) {
    // TODO: make a popup to display errors?
    return c.redirect("/?error=INVALID_ENTRY_DATE")
  }

  return c.html(
    <EntryEditor user={user} date={stringToDate(dateParam)}>
    </EntryEditor>
  )
})

app.get("/entry/:entryId/edit", async (c) => {
  const isValidToken = await validateTokenFromContext(c);
  if (!isValidToken) {
    return c.redirect("/login");
  }

  const user = await getUserFromContext(c) as User;

  const entryId = c.req.param("entryId");

  // validate entryId
  const selectedEntry = await getJournalEntryFromEntryId(entryId);
  if (!selectedEntry) {
    return c.redirect("/?error=INVALID_ENTRY_ID")
  }
  const selectedDate = selectedEntry.date;

  return c.html(
    <EntryEditor user={user} date={selectedDate} entry={selectedEntry}>
    </EntryEditor>
  )
})

app.post("/api/entry", entryPayloadValidator, async (c) => {
  const isValidToken = await validateTokenFromContext(c);
  if (!isValidToken) {
    return c.redirect("/login");
  }

  const user = await getUserFromContext(c) as User;

  //TODO: validate date

  const entryPayload = c.req.valid("json");
  const newEntry: JournalEntry = {
    id: randomUUID(),
    title: entryPayload.title,
    note: entryPayload.note,
    imagePaths: entryPayload.imagePaths,
    date: new Date(entryPayload.date)
  };

  await insertJournalEntry(user.id, newEntry);

  const [year, month, day] = dateToString(newEntry.date).split('-').map(Number);

  return c.redirect(`/entry/${year}/${month}/${day}`);
})

app.put("/api/entry/:entryId", entryPayloadValidator, async (c) => {
  const isValidToken = await validateTokenFromContext(c);
  if (!isValidToken) {
    return c.redirect("/login");
  }

  const user = await getUserFromContext(c) as User;

  const entryId = c.req.param("entryId");
  const { title, note, imagePaths, date } = c.req.valid("json");

  const existingEntry = await getJournalEntryFromEntryId(entryId);
  if (!existingEntry) {
    return c.redirect("/?error=ENTRY_NOT_FOUND");
  } else if (existingEntry.userId != user.id) {
    return c.redirect("/?error=FORBIDDEN_ENTRY_NOT_OWNED");
  }

  updateJournalEntry(user.id, {
    id: existingEntry.id,
    title: title,
    note: note,
    imagePaths: imagePaths,
    date: new Date(date)
  })
})

app.get("/:year", async (c) => {
  const isValidToken = await validateTokenFromContext(c);
  if (!isValidToken) {
    return c.redirect("/login");
  }

  const year = c.req.param("year");
  if (!validateRequestedYear(year)) {
    return c.redirect("/?error=INVALID_YEAR")
  }

  const user = await getUserFromContext(c) as User;
  const hideEmpty = c.req.query('hideEmpty') === 'true';

  const journalEntries = await getJournalEntries(user.id);

  return c.html(
    <DashboardPage user={user} requestedYear={Number(year)} journalEntries={journalEntries} hideEmptyDays={hideEmpty} />
  )
})

app.get("/:year/:month", async (c) => {
  const isValidToken = await validateTokenFromContext(c);
  if (!isValidToken) {
    return c.redirect("/login");
  }

  const year = Number(c.req.param("year"));
  if (!validateRequestedYear(year.toString())) {
    return c.redirect("/?error=INVALID_YEAR")
  }

  const month = Number(c.req.param("month"));
  if (isNaN(month) || month < 1 || month > 12) {
    return c.redirect(`/${year}?error=INVALID_MONTH`)
  }

  const user = await getUserFromContext(c) as User;
  const hideEmpty = c.req.query('hideEmpty') === 'true';

  const journalEntries = await getJournalEntries(user.id);

  return c.html(
    <DashboardPage user={user} requestedYear={Number(year)} requestedMonth={month - 1} journalEntries={journalEntries} hideEmptyDays={hideEmpty} />
  )
})

export default app;
