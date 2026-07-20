import { BaseLayout } from "../layouts/BaseLayout"; // Adjust import path as needed
import type { User, JournalEntry } from "../db/schema"; // Adjust import path as needed
import { dateToString } from "../backend/entry";

interface EntryEditorProps {
  user: User;
  // If entry is passed, we are in EDIT mode. If undefined, we are in CREATE mode.
  date: Date;
  entry?: JournalEntry;
}

export function EntryEditor({ user, date, entry }: EntryEditorProps) {
  const isEditMode = Boolean(entry?.id);
  const pageTitle = isEditMode ? "Edit Entry - Slice of Life" : "New Entry - Slice of Life";

  // Formatting the date to YYYY-MM-DD format for the HTML native date input
  const defaultDateString = date
    ? new Date(date).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];

  // Safely extract paths array for clean server-side JSX rendering
  const existingImagePaths: string[] = entry?.imagePaths || [];

  return (
    <BaseLayout
      user={user}
      title={pageTitle}
      stylesheets={["/static/assets/css/entry-editor.css"]}
      scripts={["/static/assets/js/entry-editor.js"]}
    >
      <div class="editor-container">
        <header class="editor-header">
          <h1>{isEditMode ? "Edit Journal Entry" : "Create New Entry"}</h1>
          <p class="editor-subtitle">
            {isEditMode ? "Modify your thoughts or update your pictures" : "Capture what happened today"}
          </p>
        </header>

        <form
          id="entryForm"
          class="editor-form"
          data-mode={isEditMode ? "edit" : "create"}
          data-entry-id={entry?.id || ""}
        >

          {/* Date Input */}
          <div class="form-group">
            <label for="entryDate">Date of Entry</label>
            <input
              type="date"
              id="entryDate"
              name="date"
              required
              value={defaultDateString}
              class="native-date-picker"
            />
          </div>

          {/* Title Field */}
          <div class="form-group">
            <md-outlined-text-field
              label="Title"
              id="entryTitle"
              name="title"
              required
              value={entry?.title || ""}
              style="width: 100%;"
            ></md-outlined-text-field>
          </div>

          {/* Note/Body Field */}
          <div class="form-group">
            <md-outlined-text-field
              type="textarea"
              label="Write your thoughts..."
              id="entryNote"
              name="note"
              required
              rows="8"
              value={entry?.note || ""}
              style="width: 100%;"
            ></md-outlined-text-field>
          </div>

          {/* Image Assets Management Frame */}
          <div class="form-group image-manager-section">
            <label>Images</label>

            {/* Clicking this wrapper triggers the native multiple file picker hidden inside it */}
            <div class="image-upload-zone" id="uploadZone">
              <span class="material-symbols-outlined">add_a_photo</span>
              <p>Click to select or drag images here</p>

              <input
                type="file"
                id="fileInput"
                accept="image/*"
                multiple
                style="display: none;"
              />
            </div>

            <input
              type="hidden"
              id="imagePathsPayload"
              name="imagePaths"
              value={JSON.stringify(existingImagePaths)}
            />

            <div class="image-preview-grid" id="previewGrid">
              {existingImagePaths.map((path) => (
                <div class="preview-card" data-url={path}>
                  <img src={path} alt="Journal asset" />
                  <button type="button" class="remove-img-btn">
                    <span class="material-symbols-outlined">close</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Form Action Strip */}
          <div class="form-actions-strip">
            <md-filled-button type="submit" id="submitFormBtn">
              {isEditMode ? "Save Changes" : "Publish Entry"}
            </md-filled-button>

            <md-outlined-button href={`/#${dateToString(date)}`}>
              Cancel
            </md-outlined-button>

            {/* TODO: add "are you sure?" */}
            {isEditMode && (
              <md-text-button
                type="button"
                class="danger-action-btn"
                onclick={`handleDeleteEntry('${entry?.id}')`}
                style="--md-text-button-label-text-color: var(--md-sys-color-error, #b3261e);"
              >
                Delete Entry
              </md-text-button>
            )}
          </div>

        </form>
      </div>
    </BaseLayout>
  );
}
