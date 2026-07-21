import { BaseLayout } from '../layouts/BaseLayout';
import { type JournalEntry, type User } from '../db/schema';
import { dateToString, getDaysInMonth, getMonthNames, type MonthGroup } from '../backend/entry';

export type DashboardPageProps = {
  user: User;
  requestedYear?: number;
  requestedMonth?: number;
  journalEntries: JournalEntry[];
  hideEmptyDays: boolean;
}

export function DashboardPage({ user, requestedYear, requestedMonth, journalEntries = [], hideEmptyDays = false }: DashboardPageProps) {
  requestedYear = requestedYear || new Date().getFullYear();

  const currentDate = new Date();

  const monthNames = getMonthNames();
  const monthGroups: MonthGroup[] = [];
  monthNames.forEach((monthName, monthIndex) => {
    const daysInMonth = getDaysInMonth(requestedYear, monthIndex)
    monthGroups[monthIndex] = {
      monthName: monthName,
      year: requestedYear,
      journalEntries: Array(daysInMonth).fill(null),
    }
  })

  journalEntries.filter(entry => {
    if (requestedMonth && requestedMonth != entry.date.getMonth()) {
      return false
    }
    return entry.date.getFullYear() == requestedYear;
  }).forEach(entry => {
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

      const parsedDate = new Date(requestedYear, monthIndex, dayIndex + 1);

      const currentDate = new Date();
      const isCurrentDate = currentDate.getFullYear() == requestedYear &&
        currentDate.getMonth() == monthIndex &&
        currentDate.getDate() == dayIndex + 1

      const elementId = `${dateToString(parsedDate)}`

      if (journalEntry == null) {
        if (hideEmptyDays) {
          return;
        }
        // const requestedDate = new Date(requestedYear, monthIndex, dayIndex + 1);
        return (
          <div id={elementId} class={`entry-card empty-placeholder ${isCurrentDate ? "current-entry" : ""}`}>
            <a href={`/entry/new?date=${dateToString(parsedDate)}`} class="material-symbols-outlined no-link-style">add</a>
            <span class="date-text">{monthGroup.monthName} {dayIndex + 1}</span>
          </div>
        )
      }

      const hasImage = journalEntry.imagePaths.length > 0;

      // actual entry box
      return (
        <a href={`/entry/${requestedYear}/${monthIndex + 1}/${dayIndex + 1}`} id={elementId} class="entry-card real-entry no-link-style" title={journalEntry.title}>
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

    const visibleEntries = monthGroup.journalEntries.filter((journalEntry) => {
      return journalEntry != undefined;
    })

    if (requestedMonth !== undefined) {
      if (monthIndex !== requestedMonth) {
        return;
      }
    } else {
      if (visibleEntries.length == 0 && (monthIndex != currentDate.getMonth() || requestedYear != currentDate.getFullYear())) {
        return;
      }
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
    <BaseLayout user={user} title="Dashboard - Slice of Life" stylesheets={["/static/assets/css/dashboard.css"]} scripts={["/static/assets/js/dashboard.js"]}>
      {/* TODO: seek to the next day thats available */}
      <a href={`/entry/new?date=${dateToString(new Date())}`} class="m3-fab">
        <span class="material-symbols-outlined">add</span>
      </a>

      {monthGroupElements}

    </BaseLayout >
  )
}
