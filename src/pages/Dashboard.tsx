import { BaseLayout } from '../layouts/BaseLayout';

export type JournalEntry = {
  id: string;
  date: Date;
  title: string;
  note: string;
  imagePaths: string[];
}

export type JournalEntryNullable = JournalEntry | null;

export type MonthGroup = {
  monthName: string;
  year: number;
  journalEntries: JournalEntryNullable[];
}

type DashboardPageProps = {
  username: string;
  currentYear: number;
  journalEntries: JournalEntry[];
  hideEmptyDays?: boolean;
}

function getMonthNames(locale: string = 'en-US'): string[] {
  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(2026, index, 1); // year doesnt matter
    return date.toLocaleDateString(locale, { month: 'long' });
  });
}

function getDaysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

// TODO: export to backend/calendar.ts to standardize handling dates across code
export function dateToString(date: Date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function stringToDate(dateString: string) {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year as number, (month as number - 1), day as number);
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

export function DashboardPage({ username, currentYear, journalEntries = [], hideEmptyDays = false }: DashboardPageProps) {
  const monthNames = getMonthNames();
  const monthGroups: MonthGroup[] = [];
  monthNames.forEach((monthName, monthIndex) => {
    const daysInMonth = getDaysInMonth(currentYear, monthIndex)
    monthGroups[monthIndex] = {
      monthName: monthName,
      year: currentYear,
      journalEntries: Array(daysInMonth).fill(null),
    }
  })

  journalEntries.forEach(entry => {
    const monthIndex = entry.date.getMonth();
    const dayIndex = entry.date.getDate() - 1;

    const monthGroup = monthGroups[monthIndex] as MonthGroup;
    monthGroup.journalEntries[dayIndex] = entry;
  });

  // construct the monthgroups containers
  const monthGroupElements = monthGroups.map((monthGroup, monthIndex) => {

    // construct the entries gallery contents
    const entriesGalleryElements = monthGroup.journalEntries.map((journalEntry, dayIndex) => {
      // empty entry box
      if (journalEntry == null) {
        if (hideEmptyDays) {
          return;
        }
        // const currentDate = new Date(currentYear, monthIndex, dayIndex + 1);
        return (
          <div class="entry-card empty-placeholder">
            <a href={`/entry/${currentYear}/${monthIndex + 1}/${dayIndex + 1}`} class="material-symbols-outlined">add</a>
            <span class="date-text">{monthGroup.monthName} {dayIndex + 1}</span>
          </div>
        )
      }

      const hasImage = journalEntry.imagePaths.length > 0;
      console.log(journalEntry.imagePaths.length)

      // actual entry box
      return (
        <a href={`/entry/${currentYear}/${monthIndex + 1}/${dayIndex + 1}`} class="entry-card real-entry" title={journalEntry.title}>
          {
            hasImage ? (
              <img
                src={journalEntry.imagePaths[0] || "/static/assets/images/placeholder.png"}
                alt={journalEntry.title}
                loading="lazy"
              />
            ) : (
              <span class="material-symbols-outlined entry-icon-placeholder">landscape</span>
            )
          }

          <div class="entry-top-bar">
            <span class="entry-title">{journalEntry.title}</span>
            <span class="date-text">{monthGroup.monthName} {dayIndex + 1}</span>
          </div>

          <div class="entry-bottom-bar">
            {
              // TODO: possibly markdown renderer?
            }
            <span class="entry-note">{journalEntry.note}</span>
          </div>
        </a>
      );
    });

    // hide if hideEmptyDays == true
    const visibleEntries = monthGroup.journalEntries.filter((journalEntry) => {
      return journalEntry != undefined;
    })
    if (visibleEntries.length == 0) {
      return
    }

    return (
      <section class="month-section">
        <h2 class="section-title">
          {monthGroup.monthName} <span class="section-year">{monthGroup.year}</span>
        </h2>

        <div class="entries-gallery">
          {entriesGalleryElements}
        </div>
      </section>
    )
  })

  return (
    <BaseLayout username={username} title="Dashboard - Slice of Life" stylesheets={["/static/assets/css/dashboard.css"]}>
      <a href="/entry/new" class="m3-fab">
        <span class="material-symbols-outlined">add</span>
      </a>

      {monthGroupElements}

    </BaseLayout>
  )
}
