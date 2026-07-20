import { BaseLayout } from '../layouts/BaseLayout';
import { type JournalEntry, type User } from '../db/schema';
import { stringToDate } from '../backend/entry';

interface EntryPageProps {
  user: User;
  dateString: string;
  journalEntry?: JournalEntry;
}

export function EntryPage({ user, dateString, journalEntry }: EntryPageProps) {
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

  const hasImages = journalEntry.imagePaths && journalEntry.imagePaths.length > 0;
  const totalImages = journalEntry.imagePaths ? journalEntry.imagePaths.length : 0;
  const showControls = totalImages > 1;

  return (
    <BaseLayout
      user={user}
      title={`${journalEntry.title} - Slice of Life`}
      stylesheets={["/static/assets/css/entry.css"]}
      scripts={showControls ? ["/static/assets/js/entry-carousel.js"] : []}
    >
      <div class="entry-view-container">

        <div class="entry-nav-strip">
          <a href="/" class="entry-back-button">
            <span class="material-symbols-outlined">arrow_back</span>
          </a>
        </div>

        <article class="entry-main-card">

          {hasImages ? (
            <div class="entry-carousel-wrapper">
              {/* Note: aspect-ratio is removed here and handled by the script/CSS heights */}
              <div class="entry-carousel-container" id="carousel">
                {journalEntry.imagePaths.map((path, idx) => (
                  <div class="entry-hero-frame" key={idx}>
                    <img
                      src={path}
                      alt={`${journalEntry.title} - View ${idx + 1}`}
                      loading={idx === 0 ? "eager" : "lazy"}
                      draggable="false"
                      /* Triggers height initialization on script load if image is cached */
                      onload="this.setAttribute('data-loaded', 'true')"
                    />
                  </div>
                ))}
              </div>

              {showControls && (
                <div class="carousel-counter" id="carouselCounter">
                  1 / {totalImages}
                </div>
              )}

              {showControls && (
                <>
                  <button class="carousel-nav-btn prev" id="prevBtn" aria-label="Previous image">
                    <span class="material-symbols-outlined">chevron_left</span>
                  </button>
                  <button class="carousel-nav-btn next" id="nextBtn" aria-label="Next image">
                    <span class="material-symbols-outlined">chevron_right</span>
                  </button>
                </>
              )}
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
