import { BaseLayout } from '../layouts/BaseLayout';

export interface JournalEntry {
  id: string;
  date: Date;
  title: string;
  note: string;
  imagePath?: string;
}

export interface MonthGroup {
  monthName: string;
  year: string;
  entries: (JournalEntry | null)[];
}

interface DashboardPageProps {
  groups: MonthGroup[];
  hideEmptyDays?: boolean;
}

export function DashboardPage({ groups, hideEmptyDays = false }: DashboardPageProps) {
  return (
    <BaseLayout title="Dashboard - Slice of Life" stylesheets={["/static/assets/css/dashboard.css"]}>
      <div class="dashboard-wrapper">

        <a href="/entry/new" class="m3-fab">
          <span class="material-symbols-outlined">add</span>
        </a>

        {groups.map((group) => {
          const visibleEntries = hideEmptyDays
            ? group.entries.filter((entry): entry is JournalEntry => entry !== null)
            : group.entries;

          if (visibleEntries.length === 0) return null;

          return (
            <section class="time-section">
              <h2 class="section-title">
                {group.monthName} <span class="section-year">{group.year}</span>
              </h2>

              <div class="entries-gallery">
                {visibleEntries.map((entry, index) => {
                  if (!entry) {
                    return (
                      <div class="entry-card empty-placeholder">
                        <a class="material-symbols-outlined" href="/entry/new">add</a>
                        <span class="date-text">{group.monthName} {index + 1}</span>
                      </div>
                    );
                  }

                  return (
                    <a href={`/entry/${entry.id}`} class="entry-card real-entry" title={entry.note}>
                      <img
                        src={entry.imagePath || "/static/assets/images/placeholder.png"}
                        alt={entry.title}
                        loading="lazy"
                      />

                      <div class="entry-top-bar">
                        <span class="entry-title">{entry.title}</span>
                        <span class="date-text">{group.monthName} {index + 1}</span>
                      </div>

                      <div class="entry-bottom-bar">
                        <span class="entry-note">{entry.note}</span>
                      </div>
                    </a>
                  );
                })}
              </div>
            </section>
          );
        })}

      </div>
    </BaseLayout>
  );
}
