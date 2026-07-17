import { Hono } from "hono";
import accounts from "./backend/accounts";
import { deleteToken, validateTokenFromContext } from "./backend/cookies";
import { serveStatic } from "hono/bun";

import { LoginPage } from "./pages/Login";
import { RegisterPage } from "./pages/Register";
import { DashboardPage, type JournalEntry, type MonthGroup } from './pages/Dashboard';
import { index } from "drizzle-orm/gel-core";
import { EntryPage } from "./pages/Entry";

const app = new Hono();

const mockEntries: JournalEntry[] = [
  {
    id: "e1",
    date: new Date("2026-07-15"),
    title: "Coffee at San Mateo cafe",
    note: "Tried the new nitro cold brew. Very smooth.",
    imagePath: "/static/assets/images/coffee.png"
  },
  {
    id: "e2",
    date: new Date("2026-07-13"),
    title: "Calabarzon Roadtrip Walk",
    note: "Sunny afternoon walk along the ridge line.",
    imagePath: "/static/assets/images/road.png"
  },
  {
    id: "e3",
    date: new Date("2026-06-28"),
    title: "Finished project milestone",
    note: "Finally pushed the working UI architecture live today.",
    imagePath: ""
  },
  {
    id: "e4",
    date: new Date("2026-06-25"),
    title: "Rainy evening music session",
    note: "Listened to some lo-fi vinyl ambient records while tracking rain outside.",
    imagePath: "/static/assets/images/rain.png"
  }
];

app.get('/', async (c) => {
  const isValidToken = await validateTokenFromContext(c);
  if (!isValidToken) {
    return c.redirect("/login");
  }

  // 1. Group actual entries by their Year-Month keys first
  const activeMonths = new Set<string>();
  mockEntries.forEach(e => {
    const key = `${e.date.getFullYear()}-${e.date.getMonth()}`; // e.g. "2026-6" (July)
    activeMonths.add(key);
  });

  // 2. Build complete monthly calendar maps containing every numerical day string
  const mockGroups: MonthGroup[] = Array.from(activeMonths).map(yearMonthKey => {
    const [yearNum, monthNum] = yearMonthKey.split('-').map(Number);
    const targetDate = new Date(yearNum, monthNum, 1);

    const monthName = targetDate.toLocaleDateString('en-US', { month: 'long' });
    const year = yearNum.toString();

    // Determine total days in this specific month
    const totalDays = new Date(yearNum, monthNum + 1, 0).getDate();
    const daySlots: (JournalEntry | null)[] = [];

    // Loop chronologically backwards (from last day of the month down to 1st)
    for (let day = totalDays; day >= 1; day--) {
      // Find a matching entry for this specific day
      const match = mockEntries.find(e =>
        e.date.getFullYear() === yearNum &&
        e.date.getMonth() === monthNum &&
        e.date.getDate() === day
      );

      daySlots.push(match || null);
    }

    return {
      monthName,
      year,
      entries: daySlots
    };
  });

  // Sort groups so newer months display at the top of the dashboard
  mockGroups.sort((a, b) => {
    const dateA = new Date(`${a.monthName} 1, ${a.year}`);
    const dateB = new Date(`${b.monthName} 1, ${b.year}`);
    return dateB.getTime() - dateA.getTime();
  });

  const hideEmpty = c.req.query('hideEmpty') === 'true';
  return c.html(
    <DashboardPage groups={mockGroups} hideEmptyDays={hideEmpty} />
  );
});

app.get("/entry/:entryId", async (c) => {
  const entryId = c.req.param("entryId");
  var entry: JournalEntry = {
    id: "null",
    date: new Date(),
    title: "Entry not found",
    note: "Entry not found"
  }
  if (entryId) {
    const requestedEntry = mockEntries.find((otherEntry) => {
      if (otherEntry.id == entryId) {
        return otherEntry;
      }
    });
    if (requestedEntry) {
      entry = requestedEntry;
    }
  }

  return c.html(
    <EntryPage entry={entry}>
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
