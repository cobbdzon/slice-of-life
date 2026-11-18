import { BaseLayout } from '../layouts/BaseLayout';
import { type JournalEntry, type User } from '../db/schema';
import { dateToStringUTC, stringToDate } from '../backend/entry';
import { getFileSizeOfImagePaths } from '../db/queries/uploads';

interface EntryPageProps {
  user: User;
  dateString: string;
  journalEntry?: JournalEntry;
  isEmpty?: boolean;
  showFileSize?: boolean;
}

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  timeZone: 'UTC',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
};

export async function EntryPage({ user, dateString, journalEntry, isEmpty = false, showFileSize = true }: EntryPageProps) {
  const requestedEntryDate = stringToDate(dateString);
  journalEntry = journalEntry || {
    id: "null",
    date: requestedEntryDate,
    title: "Entry not found",
    note: "",
    imagePaths: [],
  };

  const entryDate = journalEntry.date;
  const formattedDate = entryDate.toLocaleDateString('en-US', DATE_FORMAT);
  const weekday = entryDate.toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'long' });
  const dayNumber = String(entryDate.getUTCDate()).padStart(2, '0');

  const backHref = `/#${dateToStringUTC(entryDate).slice(5)}`;
  const newEntryHref = `/entry/new?date=${dateToStringUTC(entryDate)}`;

  const hasImages = journalEntry.imagePaths.length > 0;
  const totalImages = journalEntry.imagePaths.length;
  const showControls = totalImages > 1;

  let fileSizeText = ""
  if (showFileSize && hasImages) {
    const entryFileSize = (await getFileSizeOfImagePaths(journalEntry.imagePaths)) / (1024 * 1024);
    fileSizeText = `${entryFileSize.toFixed(2)} MiB`
  }

  const stylesheets = ["/static/assets/css/entry.css"];
  const scripts = hasImages ? ["/static/assets/js/entry-carousel.js"] : [];

  // A day with no entry gets its own invitation to write, not a hollow copy of
  // the reading layout with a broken edit link.
  if (isEmpty) {
    return (
      <BaseLayout user={user} title={`${formattedDate} - Slice of Life`} stylesheets={stylesheets}>
        <div class="entry-view">
          <nav class="entry-topbar">
            <a href={backHref} class="entry-back">
              <span class="material-symbols-outlined" aria-hidden="true">arrow_back</span>
              <span>Back to calendar</span>
            </a>
          </nav>

          <section class="entry-empty">
            <div class="entry-empty__mark" aria-hidden="true">
              <span class="material-symbols-outlined">edit_note</span>
            </div>
            <p class="entry-empty__date">{weekday}, {formattedDate}</p>
            <h1 class="entry-empty__title">Nothing written yet.</h1>
            <p class="entry-empty__text">This day is still open. Add a title, a note, or a photo to keep it.</p>
            <a href={newEntryHref} class="entry-primary-action">
              <span class="material-symbols-outlined" aria-hidden="true">edit</span>
              Write an entry
            </a>
          </section>
        </div>
      </BaseLayout>
    );
  }

  return (
    <BaseLayout
      user={user}
      title={`${journalEntry.title} - Slice of Life`}
      stylesheets={stylesheets}
      scripts={scripts}
    >
      <div class="entry-view">
        <nav class="entry-topbar">
          <a href={backHref} class="entry-back">
            <span class="material-symbols-outlined" aria-hidden="true">arrow_back</span>
            <span>Back to calendar</span>
          </a>
        </nav>

        <article class={`entry-article${hasImages ? " entry-article--with-media" : ""}`}>
          {
            hasImages && (
              <div class="entry-hero">
                <button class="entry-expand-btn" id="expandBtn" type="button" aria-label="View photo full screen">
                  <span class="material-symbols-outlined expand-icon" aria-hidden="true">fullscreen</span>
                  <span class="material-symbols-outlined collapse-icon" aria-hidden="true">close</span>
                </button>

                <div class="entry-hero__frame" id="carousel" tabIndex={0} aria-label="Photos for this entry">
                  {
                    journalEntry.imagePaths.map((path, idx) => (
                      <div class="entry-hero__slide" key={idx}>
                        <img
                          src={path}
                          alt={`${journalEntry.title} — photo ${idx + 1}`}
                          loading={idx === 0 ? "eager" : "lazy"}
                          draggable={false}
                        />
                      </div>
                    ))
                  }
                </div>

                {
                  showControls && (
                    <>
                      <div class="carousel-counter" id="carouselCounter" aria-live="polite">1 / {totalImages}</div>
                      <button class="carousel-nav-btn prev" id="prevBtn" type="button" aria-label="Previous photo">
                        <span class="material-symbols-outlined" aria-hidden="true">chevron_left</span>
                      </button>
                      <button class="carousel-nav-btn next" id="nextBtn" type="button" aria-label="Next photo">
                        <span class="material-symbols-outlined" aria-hidden="true">chevron_right</span>
                      </button>
                      <div class="carousel-dots" aria-hidden="true">
                        {journalEntry.imagePaths.map((_, idx) => (
                          <span class={`carousel-dots__dot${idx === 0 ? " is-active" : ""}`} key={idx}></span>
                        ))}
                      </div>
                    </>
                  )
                }
              </div>
            )
          }

          <div class="entry-content">
            <div class="entry-main">
              <header class="entry-heading">
                <div class="entry-dateline">
                  <span class="entry-dateline__day" aria-hidden="true">{dayNumber}</span>
                  <div class="entry-dateline__detail">
                    <p class="entry-dateline__date">
                      <span class="sr-only">Entry date: </span>{weekday}, {formattedDate}
                    </p>
                    <p class="entry-dateline__meta">
                      {hasImages && <span>{totalImages} {totalImages === 1 ? "photo" : "photos"}</span>}
                      {fileSizeText && <span>{fileSizeText}</span>}
                      {!hasImages && <span>Text entry</span>}
                    </p>
                  </div>
                </div>
                <h1 class="entry-title">{journalEntry.title}</h1>
              </header>

              <p class="entry-note">{journalEntry.note || "No note for this entry."}</p>

              <footer class="entry-actions">
                <a href={`/entry/${journalEntry.id}/edit`} class="entry-primary-action">
                  <span class="material-symbols-outlined" aria-hidden="true">edit</span>
                  Edit entry
                </a>
              </footer>
            </div>
          </div>
        </article>
      </div>
    </BaseLayout>
  );
}
