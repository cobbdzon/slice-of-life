import { BaseLayout } from '../layouts/BaseLayout';
import { Seeker } from '../components/Seeker';
import { type JournalEntry, type User } from '../db/schema';
import { dateToString, getDaysInMonth, getMonthNames, type MonthGroup } from '../backend/entry';
import { getFileSizeOfImagePaths } from '../db/queries/uploads';

export type DashboardPageProps = {
  user: User;
  requestedYear?: number;
  requestedMonth?: number;
  journalEntries: JournalEntry[];
  hideEmptyDays?: boolean;
  showFileSize?: boolean;
}

export async function DashboardPage({ user, requestedYear, requestedMonth, journalEntries = [], hideEmptyDays = false, showFileSize = true }: DashboardPageProps) {
  requestedYear = requestedYear || new Date().getFullYear();

  const currentDate = new Date();
  const isCurrentMonthRendered =
    requestedYear === currentDate.getFullYear() &&
    (requestedMonth === undefined || requestedMonth === currentDate.getMonth());

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

  journalEntries.forEach(entry => {
    const monthIndex = entry.date.getUTCMonth();
    const dayIndex = entry.date.getUTCDate() - 1;

    const monthGroup = monthGroups[monthIndex] as MonthGroup;
    monthGroup.journalEntries[dayIndex] = entry;
  });

  // construct the monthgroups containers
  const monthGroupElements = monthGroups.map((monthGroup, monthIndex) => {

    // construct the entries gallery contents
    const entriesGalleryElements = monthGroup.journalEntries.map(async (journalEntry, dayIndex) => {
      // empty entry box

      const parsedDate = new Date(requestedYear, monthIndex, dayIndex + 1);

      const currentDate = new Date();
      const isCurrentDate = currentDate.getFullYear() === requestedYear &&
        currentDate.getMonth() === monthIndex &&
        currentDate.getDate() === dayIndex + 1

      const elementId = `${dateToString(parsedDate)}`

      const dayNumber = String(dayIndex + 1).padStart(2, "0");

      if (journalEntry === null) {
        if (hideEmptyDays) {
          return;
        }
        return (
          <a
            href={`/entry/new?date=${dateToString(parsedDate)}`}
            id={elementId}
            class={`entry-card entry-card--empty${isCurrentDate ? " is-today" : ""}`}
            aria-label={`Write an entry for ${monthGroup.monthName} ${dayIndex + 1}`}
          >
            <span class="entry-day" aria-hidden="true">{dayNumber}</span>
            <span class="empty-add" aria-hidden="true">
              <span class="material-symbols-outlined">add</span>
            </span>
            <span class="empty-label" aria-hidden="true">Write</span>
            {isCurrentDate && <span class="today-badge" aria-hidden="true">Today</span>}
          </a>
        )
      }

      const hasImage = journalEntry.imagePaths.length > 0;

      // TODO: client side async?
      let fileSizeText = ""
      if (showFileSize && journalEntry.imagePaths.length > 0) {
        const entryFileSize = (await getFileSizeOfImagePaths(journalEntry.imagePaths)) / (1024 * 1024);
        fileSizeText = `${entryFileSize.toFixed(2)} MiB`
      }

      // actual entry box
      return (
        <a
          href={`/entry/${requestedYear}/${monthIndex + 1}/${dayIndex + 1}`}
          id={elementId}
          class={`entry-card entry-card--entry no-link-style${hasImage ? " entry-card--media" : " entry-card--note"}${isCurrentDate ? " is-today" : ""}`}
          title={journalEntry.title}
          aria-label={`${monthGroup.monthName} ${dayIndex + 1}: ${journalEntry.title}`}
        >
          {
            hasImage && (
              <img
                src={journalEntry.imagePaths[0] || "/static/assets/images/placeholder.png"}
                alt=""
                loading="lazy"
              />
            )
          }

          <span class="entry-day" aria-hidden="true">{dayNumber}</span>

          <div class="entry-body">
            <span class="entry-title">{journalEntry.title}</span>
            <span class="entry-note">{journalEntry.note}</span>
            {
              fileSizeText && <span class="entry-meta">{fileSizeText}</span>
            }
          </div>

          {
            hasImage && (
              <span class="entry-media-badge" aria-hidden="true">
                <span class="material-symbols-outlined">photo_camera</span>
              </span>
            )
          }
          {isCurrentDate && <span class="today-badge" aria-hidden="true">Today</span>}
        </a>
      );
    });

    if (requestedMonth !== undefined && monthIndex !== requestedMonth) {
      return;
    }

    const isCurrentMonth = monthIndex === currentDate.getMonth() && requestedYear === currentDate.getFullYear();
    const writtenCount = monthGroup.journalEntries.filter(entry => entry !== null).length;
    const dayCount = monthGroup.journalEntries.length;
    const writtenPercent = dayCount > 0 ? Math.round((writtenCount / dayCount) * 100) : 0;

    return (
      <section data-month={monthIndex} class={`month-section${isCurrentMonth ? " month-section--current" : ""}`}>
        <div class="month-header">
          <div class="month-header__title">
            <h2 class="section-title">{monthGroup.monthName}</h2>
            <span class="section-year">{monthGroup.year}</span>
          </div>
          <div class="month-progress" aria-label={`${writtenCount} of ${dayCount} days written`}>
            <span class="month-progress__count">{writtenCount}<span class="month-progress__total">/{dayCount}</span></span>
            <span class="month-progress__label">days written</span>
            <span class="month-progress__track" aria-hidden="true">
              <span class="month-progress__fill" style={`width: ${writtenPercent}%`}></span>
            </span>
          </div>
        </div>

        <div class="entries-gallery">
          {entriesGalleryElements}
        </div>
      </section>
    )
  })

  return (
    <BaseLayout user={user} title="Dashboard - Slice of Life" stylesheets={["/static/assets/css/dashboard.css"]} scripts={["/static/assets/js/dashboard.js"]}>
      {/* TODO: seek to the next day thats available */}
      <a href={`/entry/new?date=${dateToString(new Date())}`} class="m3-fab" aria-label="Write today's entry">
        <span class="material-symbols-outlined" aria-hidden="true">add</span>
        <span class="m3-fab__label">New entry</span>
      </a>

      <div class={`dashboard-wrapper${isCurrentMonthRendered ? " has-current" : ""}`}>
        {monthGroupElements}
      </div>

      <Seeker year={requestedYear} month={requestedMonth} singleMonthView={requestedMonth !== undefined} />

    </BaseLayout >
  )
}
