import { BaseLayout } from '../layouts/BaseLayout';
import { type JournalEntry, type User } from '../db/schema';
import { dateToString, getDaysInMonth, getMonthNames, type MonthGroup } from '../backend/entry';

export type DashboardPageProps = {
  user: User;
  currentYear: number;
  journalEntries: JournalEntry[];
  hideEmptyDays: boolean;
}

export function DashboardPage({ user, currentYear, journalEntries = [], hideEmptyDays = false }: DashboardPageProps) {
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

      const parsedDate = new Date(currentYear, monthIndex + 1, dayIndex);

      if (journalEntry == null) {
        if (hideEmptyDays) {
          return;
        }
        // const currentDate = new Date(currentYear, monthIndex, dayIndex + 1);
        return (
          <div class="entry-card empty-placeholder">
            <a href={`/entry/new?date=${dateToString(parsedDate)}`} class="material-symbols-outlined no-link-style">add</a>
            <span class="date-text">{monthGroup.monthName} {dayIndex + 1}</span>
          </div>
        )
      }

      const hasImage = journalEntry.imagePaths.length > 0;

      // actual entry box
      return (
        <a href={`/entry/${currentYear}/${monthIndex + 1}/${dayIndex + 1}`} class="entry-card real-entry no-link-style" title={journalEntry.title}>
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
    <BaseLayout user={user} title="Dashboard - Slice of Life" stylesheets={["/static/assets/css/dashboard.css"]}>
      <a href={`/entry/new?date=${dateToString(new Date())}`} class="m3-fab">
        <span class="material-symbols-outlined">add</span>
      </a>

      {monthGroupElements}

    </BaseLayout>
  )
}
