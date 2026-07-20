import { BaseLayout } from "../layouts/BaseLayout"; // Adjust import path as needed
import type { User, JournalEntry } from "../db/schema"; // Adjust import path as needed

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

            <div class="image-upload-zone" id="uploadZone">
              <span class="material-symbols-outlined">add_a_photo</span>
              <p>Click or drag to add image URLs</p>
              <input type="text" id="imageUrlInput" placeholder="Paste image URL here..." />
              <md-text-button type="button" id="addImageBtn">Add URL</md-text-button>
            </div>

            <input
              type="hidden"
              id="imagePathsPayload"
              name="imagePaths"
              value={JSON.stringify(entry?.imagePaths || [])}
            />

            <div class="image-preview-grid" id="previewGrid">
              {(entry?.imagePaths || []).map((path, index) => (
                <div class="preview-card" data-url={path} key={index}>
                  <img src={path} alt="Preview asset" />
                  <button type="button" class="remove-img-btn" onclick="removeImagePreview(this)">
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

            <md-outlined-button type="button" onclick="window.history.back()">
              Cancel
            </md-outlined-button>

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
