import { Hono } from "hono";
import accounts from "./backend/accounts";
import { deleteToken, getToken, getUserIdFromToken, validateTokenFromContext } from "./backend/cookies";
import { serveStatic } from "hono/bun";

import { LoginPage } from "./pages/Login";
import { RegisterPage } from "./pages/Register";
import { DashboardPage, validateRequestedYear, type JournalEntry } from './pages/Dashboard';
import { EntryPage } from "./pages/Entry";
import { entryValidator } from "./schemas/entry";
import { getUser } from "./db/queries";
import type { User } from "./db/schema";

const app = new Hono();

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

  const token = await getToken(c) as string;
  const userId = await getUserIdFromToken(token) as number;
  const user = await getUser(userId) as User;

  const currentYear = validateRequestedYear(c.req.query("year"));
  const hideEmpty = c.req.query('hideEmpty') === 'true';

  return c.html(
    <DashboardPage username={user.username} currentYear={currentYear} journalEntries={mockEntries} hideEmptyDays={hideEmpty} />
  );
});

app.get("/entry/:year/:month/:day", entryValidator, async (c) => {
  const isValidToken = await validateTokenFromContext(c);
  if (!isValidToken) {
    return c.redirect("/login");
  }

  const token = await getToken(c) as string;
  const userId = await getUserIdFromToken(token) as number;
  const user = await getUser(userId) as User;

  const { year, month, day } = c.req.valid("param");
  // const parsedDate = new Date(year, month - 1, day);

  const defaultEntry: JournalEntry = {
    id: "null",
    date: new Date(),
    title: "Entry not found",
    note: "Entry not found",
    imagePaths: [],
  }

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
    <EntryPage username={user.username} dateString={c.req.query("date") || ""} journalEntry={journalEntries[0]}>
    </EntryPage>
  )
})

// ASSETS //
app.use('/static/*', serveStatic({ root: './src' }));

// ACCOUNTS //
app.route("/", accounts);

app.get("/login", async (c) => {
  const errorCode = c.req.query("error") as string;
  return c.html(
    <LoginPage errorCode={errorCode}>
    </LoginPage>
  );
});

app.get("/register", async (c) => {
  const errorCode = c.req.query("error") as string;
  return c.html(
    <RegisterPage errorCode={errorCode}>
    </RegisterPage>
  );
})

app.get("logout", async (c) => {
  deleteToken(c);
  return c.redirect("/login");
})

export default app;
