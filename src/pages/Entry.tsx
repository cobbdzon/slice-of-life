import { BaseLayout } from '../layouts/BaseLayout';
import { stringToDate, type JournalEntry } from './Dashboard';

interface EntryPageProps {
  dateString: string;
  journalEntry?: JournalEntry;
}

export function EntryPage({ dateString, journalEntry }: EntryPageProps) {
  const requestedEntryDate = stringToDate(dateString);

  journalEntry = journalEntry || {
    id: "null",
    date: requestedEntryDate,
    title: "Empty entry",
    note: "Entry note here",
    imagePaths: [],
  }

  const formattedDate = journalEntry.date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <BaseLayout title={`${journalEntry.title} - Slice of Life`} stylesheets={["/static/assets/css/entry.css"]}>
      <div class="entry-view-container">

        <div class="entry-nav-strip">
          <a href="/" class="entry-back-button">
            <span class="material-symbols-outlined">arrow_back</span>
          </a>
        </div>

        <article class="entry-main-card">

          {journalEntry.imagePaths[0] ? (
            <div class="entry-hero-frame">
              <img src={journalEntry.imagePaths[0]} alt={journalEntry.title} />
            </div>
          ) : (
            <div class="entry-hero-frame image-fallback-placeholder">
              <span class="material-symbols-outlined">landscape</span>
            </div>
          )}

          <div class="entry-body-frame">
            <header class="entry-header-block">
              <span class="entry-meta-date">{formattedDate}</span>
              <h1 class="entry-main-title">{journalEntry.title}</h1>
            </header>

            <div class="entry-text-block">
              <p class="entry-full-note">{journalEntry.note}</p>
            </div>

            <footer class="entry-footer-actions">
              <a href={`/entry/${journalEntry.id}/edit`} class="entry-edit-action">
                <span class="material-symbols-outlined">edit</span>
                Edit Entry
              </a>
            </footer>
          </div>

        </article>

      </div>
    </BaseLayout>
  );
}
