function updateUrlQuerySilent(key, value) {
  const url = new URL(window.location.href);
  url.searchParams.set(key, value);
  window.history.replaceState({}, "", url);
}

document.addEventListener('DOMContentLoaded', async () => {
  // --- Core Element Mappings ---
  const form = document.getElementById("entryForm");
  const entryDateElement = document.getElementById("entryDate");
  const entryTitle = document.getElementById("entryTitle");
  const entryNote = document.getElementById("entryNote");

  // --- Image Manager Elements ---
  const uploadZone = document.getElementById("uploadZone");
  const fileInput = document.getElementById("fileInput");
  const previewGrid = document.getElementById("previewGrid");
  const imagePathsPayload = document.getElementById("imagePathsPayload");

  // --- Constants for Upload Safeguards ---
  const MAX_IMAGES = 10;
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit per file

  // --- SHARED IMAGE STATE HELPERS (Scoped at top level of DOMContentLoaded) ---
  const getImagesArray = () => {
    if (!imagePathsPayload) return [];
    try {
      return JSON.parse(imagePathsPayload.value || "[]");
    } catch {
      return [];
    }
  };

  const setImagesArray = (arr) => {
    if (imagePathsPayload) {
      imagePathsPayload.value = JSON.stringify(arr);
    }
  };

  // --- Date Safeguards & Existing Entries Check ---
  let existingDatesSet = new Set();
  const isEditMode = form?.dataset.mode === "edit";
  const initialDate = entryDateElement?.value || "";

  try {
    const res = await fetch("/api/entry/existing");
    if (res.ok) {
      const datesArray = await res.json(); // ["2026-07-21T00:00:00.000Z", ...]
      existingDatesSet = new Set(datesArray.map(iso => iso.split("T")[0]));
    }
  } catch (err) {
    console.error("Failed to fetch existing entries:", err);
  }

  const isDateTaken = (dateStr) => {
    if (!dateStr) return false;
    if (isEditMode && dateStr === initialDate) return false;
    console.log(existingDatesSet, dateStr);
    return existingDatesSet.has(dateStr);
  };

  // --- 1. Date Query String Synchronization & Conflict Reversion ---
  if (entryDateElement) {
    let lastValidDate = entryDateElement.value;

    if (isDateTaken(lastValidDate)) {
      alert(`An entry already exists for ${lastValidDate}. Please pick a different date.`);
      entryDateElement.value = "";
      lastValidDate = "";
    }

    entryDateElement.addEventListener("change", () => {
      const selectedDate = entryDateElement.value;

      if (isDateTaken(selectedDate)) {
        alert(`An entry already exists for ${selectedDate}. Reverting to previous date.`);
        entryDateElement.value = lastValidDate; // Snaps back to previous valid date
        return;
      }

      lastValidDate = selectedDate;
      updateUrlQuerySilent("date", selectedDate);
    });
  }

  // --- 2. Material Web Component Enter Key Submission Fix ---
  const triggerSubmit = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      form.requestSubmit();
    }
  };

  if (entryTitle) entryTitle.addEventListener("keydown", triggerSubmit);
  if (entryNote) entryNote.addEventListener("keydown", triggerSubmit);

  // --- 3. Multi-File Upload Engine ---
  const handleFilesInput = async (files) => {
    const currentImages = getImagesArray();

    if (currentImages.length + files.length > MAX_IMAGES) {
      alert(`You can only have up to ${MAX_IMAGES} images per journal entry.`);
      return;
    }

    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        alert(`"${file.name}" is not an image asset.`);
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        alert(`"${file.name}" exceeds the 5MB file size limit.`);
        continue;
      }

      const tempBlobUrl = URL.createObjectURL(file);
      const card = document.createElement("div");
      card.className = "preview-card uploading";
      card.setAttribute("data-temp-url", tempBlobUrl);
      card.innerHTML = `
        <img src="${tempBlobUrl}" alt="Uploading asset..." style="opacity: 0.5;" />
        <div class="upload-spinner"></div>
      `;
      previewGrid.appendChild(card);

      const formData = new FormData();
      formData.append("image", file);

      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData
        });

        if (!response.ok) throw new Error("Upload failed");

        const data = await response.json();
        const serverUrl = data.url;

        const updatedImages = getImagesArray();
        updatedImages.push(serverUrl);
        setImagesArray(updatedImages);

        card.className = "preview-card";
        card.removeAttribute("data-temp-url");
        card.setAttribute("data-url", serverUrl);
        card.innerHTML = `
          <img src="${serverUrl}" alt="Journal asset" />
          <button type="button" class="remove-img-btn">
            <span class="material-symbols-outlined">close</span>
          </button>
        `;

      } catch (err) {
        console.error("Server Preload Error:", err);
        alert(`Failed to upload "${file.name}" to the server.`);
        card.remove();
      } finally {
        URL.revokeObjectURL(tempBlobUrl);
      }
    }
  };

  if (uploadZone && fileInput) {
    uploadZone.addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", () => {
      if (fileInput.files.length > 0) {
        handleFilesInput(fileInput.files);
        fileInput.value = "";
      }
    });

    ["dragenter", "dragover", "dragleave", "drop"].forEach(name => {
      uploadZone.addEventListener(name, (e) => e.preventDefault(), false);
    });

    ["dragenter", "dragover"].forEach(name => {
      uploadZone.addEventListener(name, () => uploadZone.classList.add("highlight"), false);
    });

    ["dragleave", "drop"].forEach(name => {
      uploadZone.addEventListener(name, () => uploadZone.classList.remove("highlight"), false);
    });

    uploadZone.addEventListener("drop", (e) => {
      if (e.dataTransfer.files.length > 0) {
        handleFilesInput(e.dataTransfer.files);
      }
    });
  }

  // --- 4. Event Delegation for Image Removal Badges ---
  if (previewGrid) {
    previewGrid.addEventListener("click", (e) => {
      const removeBtn = e.target.closest(".remove-img-btn");
      if (!removeBtn) return;

      const card = removeBtn.closest(".preview-card");
      const urlToRemove = card.getAttribute("data-url");

      let currentImages = getImagesArray();
      currentImages = currentImages.filter((path) => path !== urlToRemove);
      setImagesArray(currentImages);

      card.remove();
    });
  }

  // --- 5. Form Submission Payload Dispatches ---
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const selectedDate = entryDateElement.value;

      if (isDateTaken(selectedDate)) {
        alert(`Cannot save: an entry already exists for ${selectedDate}.`);
        return;
      }

      const entryId = form.dataset.entryId;
      const requestUrl = isEditMode ? `/api/entry/${entryId}` : "/api/entry";
      const requestMethod = isEditMode ? "PUT" : "POST";

      const payload = {
        title: entryTitle.value,
        note: entryNote.value,
        date: selectedDate,
        imagePaths: getImagesArray(), // 👈 Now safely accessible here!
      };

      try {
        const response = await fetch(requestUrl, {
          method: requestMethod,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const dateObj = new Date(payload.date);
          window.location.href = `/entry/${dateObj.getFullYear()}/${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
        } else {
          const errorData = await response.json().catch(() => ({}));
          alert(`Failed to save entry: ${errorData.message || response.statusText}`);
        }
      } catch (err) {
        console.error("Submission Failure:", err);
        alert("A network connectivity error occurred while saving.");
      }
    });
  }
});

// --- 6. Global Scope Deletion Request Pipeline ---
async function handleDeleteEntry(entryId) {
  if (!entryId || entryId === "undefined") return;

  if (!confirm("Are you absolutely certain you want to permanently delete this entry?")) {
    return;
  }

  try {
    const response = await fetch(`/api/entry/${entryId}`, {
      method: "DELETE",
    });

    if (response.ok) {
      window.location.href = "/";
    } else {
      alert("Failed to delete the entry safely.");
    }
  } catch (err) {
    console.error("Deletion Failure:", err);
    alert("A network connectivity error occurred while deleting.");
  }
}
