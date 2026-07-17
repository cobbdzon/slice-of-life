import { BaseLayout } from '../layouts/BaseLayout';
import { type JournalEntry } from './Dashboard';

interface EntryPageProps {
  entry: JournalEntry;
}

export function EntryPage({ entry }: EntryPageProps) {
  const formattedDate = entry.date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <BaseLayout title={`${entry.title} - Slice of Life`} stylesheets={["/static/assets/css/entry.css"]}>
      <div class="entry-view-container">

        <div class="entry-nav-strip">
          <a href="/" class="entry-back-button">
            <span class="material-symbols-outlined">arrow_back</span>
          </a>
        </div>

        <article class="entry-main-card">

          {entry.imagePath ? (
            <div class="entry-hero-frame">
              <img src={entry.imagePath} alt={entry.title} />
            </div>
          ) : (
            <div class="entry-hero-frame image-fallback-placeholder">
              <span class="material-symbols-outlined">landscape</span>
            </div>
          )}

          <div class="entry-body-frame">
            <header class="entry-header-block">
              <span class="entry-meta-date">{formattedDate}</span>
              <h1 class="entry-main-title">{entry.title}</h1>
            </header>

            <div class="entry-text-block">
              <p class="entry-full-note">{entry.note}</p>
            </div>

            <footer class="entry-footer-actions">
              <a href={`/entry/${entry.id}/edit`} class="entry-edit-action">
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
