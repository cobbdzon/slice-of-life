import { BaseLayout } from "../layouts/BaseLayout";
import type { User, JournalEntry } from "../db/schema";
import { dateToStringUTC } from "../backend/entry";
import { getUserTotalFilesSize } from "../db/queries/uploads";
import { Bar } from "../components/Bar";

interface EntryEditorProps {
  user: User;
  // If entry is passed, we are in EDIT mode. If undefined, we are in CREATE mode.
  date: Date;
  entry?: JournalEntry;
}

const DISPLAY_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  timeZone: "UTC",
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
};

export async function EntryEditor({ user, date, entry }: EntryEditorProps) {
  const isEditMode = Boolean(entry?.id);
  const pageTitle = isEditMode ? "Edit Entry - Slice of Life" : "New Entry - Slice of Life";

  // Formatting the date to YYYY-MM-DD format for the HTML native date input
  const defaultDateString = date ? dateToStringUTC(date) : dateToStringUTC(new Date());
  const [entryYear, entryMonth, entryDay] = defaultDateString.split("-");
  const dayNumber = String(date.getUTCDate()).padStart(2, "0");
  const formattedDate = date.toLocaleDateString("en-US", DISPLAY_DATE_FORMAT);

  // Cancel and back return where the writer came from: the entry they were
  // reading when editing, or the calendar when starting a new page.
  const entryHref = `/entry/${entryYear}/${Number(entryMonth)}/${Number(entryDay)}`;
  const cancelHref = isEditMode ? entryHref : `/?year=${entryYear}#${entryMonth}-${entryDay}`;
  const backLabel = isEditMode ? "Back to entry" : "Back to calendar";

  // Safely extract paths array for clean server-side JSX rendering
  const existingImagePaths: string[] = entry?.imagePaths || [];

  // Storage usage shown while writing, so the user knows their current usage
  const userFileSizeTaken = (await getUserTotalFilesSize(user.id)) / (1024 * 1024); // In MiB
  const userFileSizeLimit = user.fileUploadLimit || 10; // In MiB (default 10 for Free plan)
  const usageRatio = userFileSizeLimit > 0 ? userFileSizeTaken / userFileSizeLimit : 0;
  const usagePercentage = Math.round(Math.min(Math.max(usageRatio, 0), 1) * 100);
  const remainingFileSize = Math.max(userFileSizeLimit - userFileSizeTaken, 0);
  const isStorageCritical = usageRatio >= 0.9;

  return (
    <BaseLayout
      user={user}
      title={pageTitle}
      stylesheets={["/static/assets/css/entry-editor.css"]}
      scripts={["/static/assets/js/entry-editor.js"]}
    >
      <div class="editor-view">
        <nav class="editor-topbar">
          <a href={cancelHref} class="editor-back" data-editor-back>
            <span class="material-symbols-outlined" aria-hidden="true">arrow_back</span>
            <span>{backLabel}</span>
          </a>
        </nav>

        <article class="editor-sheet" aria-labelledby="editor-title">
          <header class="editor-head">
            <div class="editor-dateline">
              <span class="editor-dateline__day" id="editorDayNumber" aria-hidden="true">{dayNumber}</span>
              <p class="editor-dateline__date">
                <span class="sr-only">Entry date: </span>
                <span id="editorDateLine">{formattedDate}</span>
              </p>
            </div>

            <div class="editor-date-control">
              <label class="editor-date-control__label" htmlFor="entryDate">Date</label>
              <span class="editor-date-control__field">
                <span class="material-symbols-outlined" aria-hidden="true">calendar_month</span>
                <input
                  type="date"
                  id="entryDate"
                  name="date"
                  required
                  value={defaultDateString}
                  class="native-date-picker"
                />
              </span>
            </div>

            <h1 id="editor-title" class="editor-head__title">
              {isEditMode ? "Edit entry" : "New entry"}
            </h1>
            <p class="editor-head__subtitle">
              {isEditMode
                ? "Update the words or photos for this day."
                : "A few words and a photo are enough."}
            </p>
          </header>

          <form
            id="entryForm"
            class="editor-form"
            data-mode={isEditMode ? "edit" : "create"}
            data-entry-id={entry?.id || ""}
          >
            <div class="editor-body">
              <div class="editor-writing">
                <div class="editor-field">
                  <label class="editor-field__label" htmlFor="entryTitle">Title</label>
                  <input
                    type="text"
                    id="entryTitle"
                    name="title"
                    required
                    maxlength={255}
                    autocomplete="off"
                    placeholder="Name this day"
                    value={entry?.title || ""}
                    class="editor-field__input editor-field__input--title"
                  />
                </div>

                <div class="editor-field">
                  <div class="editor-field__labelrow">
                    <label class="editor-field__label" htmlFor="entryNote">Note</label>
                    <span class="editor-field__hint" id="noteResizeHint">
                      <span class="material-symbols-outlined" aria-hidden="true">south_east</span>
                      Drag the corner for more room
                    </span>
                  </div>
                  <textarea
                    id="entryNote"
                    name="note"
                    required
                    rows={6}
                    aria-describedby="noteResizeHint"
                    placeholder="What happened today? What do you want to remember?"
                    class="editor-field__input editor-field__textarea"
                  >{entry?.note || ""}</textarea>
                </div>
              </div>

              <aside class="editor-rail" aria-label="Entry details">
                <section class="editor-section" aria-labelledby="editor-photos-title">
                  <div class="editor-section-head">
                    <h2 id="editor-photos-title" class="editor-section-head__title">Photos</h2>
                    <span class="editor-section-head__meta" id="photoCount" aria-live="polite">{existingImagePaths.length} of 10</span>
                  </div>

                  <button type="button" class="image-upload-zone" id="uploadZone">
                    <span class="image-upload-zone__icon" aria-hidden="true">
                      <span class="material-symbols-outlined">add_photo_alternate</span>
                    </span>
                    <span class="image-upload-zone__text">
                      <strong>Add photos</strong>
                      <span>Choose files or drop them here</span>
                    </span>
                  </button>

                  <input
                    type="file"
                    id="fileInput"
                    accept="image/*"
                    multiple
                    hidden
                  />

                  <input
                    type="hidden"
                    id="imagePathsPayload"
                    name="imagePaths"
                    value={JSON.stringify(existingImagePaths)}
                  />

                  <div class="image-preview-grid" id="previewGrid">
                    {existingImagePaths.map((path, index) => (
                      <div class="preview-card" data-url={path}>
                        <img src={path} alt={`Photo ${index + 1}`} loading="lazy" />
                        <button type="button" class="remove-img-btn" aria-label={`Remove photo ${index + 1}`}>
                          <span class="material-symbols-outlined" aria-hidden="true">close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </section>

                <section
                  class={`editor-section editor-storage${isStorageCritical ? " editor-storage--critical" : ""}`}
                  aria-labelledby="editor-storage-title"
                  data-file-size-taken={userFileSizeTaken}
                  data-file-size-limit={userFileSizeLimit}
                >
                  <div class="editor-section-head">
                    <h2 id="editor-storage-title" class="editor-section-head__title">Storage</h2>
                    <span class="editor-section-head__meta">{usagePercentage}% used</span>
                  </div>

                  <Bar
                    value={usageRatio}
                    className="editor-storage__bar"
                    label={`Storage used: ${usagePercentage}%, ${userFileSizeTaken.toFixed(2)} of ${userFileSizeLimit} MiB`}
                  />

                  <div class="editor-storage__figures">
                    <p><strong>{userFileSizeTaken.toFixed(2)} MiB</strong> of {userFileSizeLimit} MiB</p>
                    <p>{remainingFileSize.toFixed(2)} MiB free</p>
                  </div>

                  {isStorageCritical && (
                    <p class="editor-storage__warning" role="status">
                      You're close to your plan limit. Remove unused photos to free space.
                    </p>
                  )}
                </section>
              </aside>
            </div>

            <footer class="editor-publish">
              <div class="editor-commit">
                <a href={cancelHref} class="editor-cancel" data-editor-back>Cancel</a>

                <button type="submit" class="editor-submit" id="submitFormBtn">
                  <span class="material-symbols-outlined" aria-hidden="true">save</span>
                  <span class="editor-submit__label">{isEditMode ? "Save changes" : "Save entry"}</span>
                </button>
              </div>

              {isEditMode && (
                <button
                  type="button"
                  class="editor-delete"
                  onclick={`handleDeleteEntry('${entry?.id}')`}
                >
                  <span class="material-symbols-outlined" aria-hidden="true">delete</span>
                  Delete entry
                </button>
              )}
            </footer>
          </form>
        </article>
      </div>
    </BaseLayout>
  );
}
