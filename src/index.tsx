import { Hono } from "hono";
import accounts from "./backend/accounts";
import { deleteToken, validateTokenFromContext } from "./backend/cookies";
import { serveStatic } from "hono/bun";

import { LoginPage } from "./pages/Login";
import { RegisterPage } from "./pages/Register";
import { DashboardPage, validateRequestedYear, type JournalEntry, type MonthGroup } from './pages/Dashboard';
import { EntryPage } from "./pages/Entry";

const app = new Hono();

const mockEntries: JournalEntry[] = [
  {
    id: "e1",
    date: new Date("2026-07-15"),
    title: "Coffee at San Mateo cafe",
    note: "Tried the new nitro cold brew. Very smooth.",
    imagePaths: ["/static/assets/images/coffee.png"]
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
    imagePaths: [""]
  },
  {
    id: "e4",
    date: new Date("2026-06-25"),
    title: "Rainy evening music session",
    note: "Listened to some lo-fi vinyl ambient records while tracking rain outside.",
    imagePaths: ["/static/assets/images/rain.png"]
  }
];

app.get('/', async (c) => {
  const isValidToken = await validateTokenFromContext(c);
  if (!isValidToken) {
    return c.redirect("/login");
  }

  const currentYear = validateRequestedYear(c.req.query("year"));
  const hideEmpty = c.req.query('hideEmpty') === 'true';

  return c.html(
    <DashboardPage currentYear={currentYear} journalEntries={mockEntries} hideEmptyDays={hideEmpty} />
  );
});

// TODO: CLEAN UP
app.get("/entry/:entryId", async (c) => {
  const entryId = c.req.param("entryId");
  var journalEntry: JournalEntry = {
    id: "null",
    date: new Date(),
    title: "Entry not found",
    note: "Entry not found",
    imagePaths: [],
  }
  if (entryId) {
    const requestedEntry = mockEntries.find((otherEntry) => {
      if (otherEntry.id == entryId) {
        return otherEntry;
      }
    });
    if (requestedEntry) {
      journalEntry = requestedEntry;
    }
  }

  return c.html(
    <EntryPage dateString={c.req.query("date") || ""} journalEntry={journalEntry}>
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
  return c.text("Logged out")
})

export default app;
