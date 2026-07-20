function updateUrlQuerySilent(key, value) {
  const url = new URL(window.location.href);
  url.searchParams.set(key, value);
  window.history.replaceState({}, "", url);
}

document.addEventListener('DOMContentLoaded', () => {
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

  // --- 1. Date Query String Synchronization ---
  if (entryDateElement) {
    entryDateElement.addEventListener("change", () => {
      updateUrlQuerySilent("date", entryDateElement.value);
    });
  }

  // --- 2. Material Web Component Enter Key Submission Fix ---
  const triggerSubmit = (e) => {
    // Only intercept if Enter is pressed without holding Shift (so textareas can new-line)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      form.requestSubmit();
    }
  };

  if (entryTitle) entryTitle.addEventListener("keydown", triggerSubmit);
  if (entryNote) entryNote.addEventListener("keydown", triggerSubmit);

  // --- 3. Multi-File Upload Engine (Immediate Server Preloading) ---
  const getImagesArray = () => JSON.parse(imagePathsPayload.value || "[]");
  const setImagesArray = (arr) => { imagePathsPayload.value = JSON.stringify(arr); };

  const handleFilesInput = async (files) => {
    const currentImages = getImagesArray();

    // Enforce strict overall count ceiling check upfront
    if (currentImages.length + files.length > MAX_IMAGES) {
      alert(`You can only have up to ${MAX_IMAGES} images per journal entry.`);
      return;
    }

    // Process picked/dropped files sequentially
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        alert(`"${file.name}" is not an image asset.`);
        continue;
      }

      // Size Constraint Verification
      if (file.size > MAX_FILE_SIZE) {
        alert(`"${file.name}" exceeds the 5MB file size limit.`);
        continue;
      }

      // Create a temporary local blob URL & card placeholder with a loading spinner
      const tempBlobUrl = URL.createObjectURL(file);
      const card = document.createElement("div");
      card.className = "preview-card uploading";
      card.setAttribute("data-temp-url", tempBlobUrl);
      card.innerHTML = `
        <img src="${tempBlobUrl}" alt="Uploading asset..." style="opacity: 0.5;" />
        <div class="upload-spinner"></div>
      `;
      previewGrid.appendChild(card);

      // Dispatch file payload directly to your backend preloader endpoint
      const formData = new FormData();
      formData.append("image", file);

      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData
        });

        if (!response.ok) throw new Error("Upload failed");

        const data = await response.json();
        const serverUrl = data.url; // The permanent URL returned by Bun/Hono

        // Update tracking state array
        const updatedImages = getImagesArray();
        updatedImages.push(serverUrl);
        setImagesArray(updatedImages);

        // Swap the loading state out for the permanent removal card
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
        card.remove(); // Evict failed UI node from DOM
      } finally {
        URL.revokeObjectURL(tempBlobUrl); // Clear temporary browser memory allocation
      }
    }
  };

  if (uploadZone && fileInput) {
    // Open system file dialogue window on interaction clicks
    uploadZone.addEventListener("click", () => fileInput.click());

    // Catch confirmation events out of the system file tree selection
    fileInput.addEventListener("change", () => {
      if (fileInput.files.length > 0) {
        handleFilesInput(fileInput.files);
        fileInput.value = ""; // Clear out input so the same files can be chosen again later
      }
    });

    // Suppress regular browser drop window behaviors opening files as link strings
    ["dragenter", "dragover", "dragleave", "drop"].forEach(name => {
      uploadZone.addEventListener(name, (e) => e.preventDefault(), false);
    });

    // Add active UI visual class changes on hover targeting tracking
    ["dragenter", "dragover"].forEach(name => {
      uploadZone.addEventListener(name, () => uploadZone.classList.add("highlight"), false);
    });
    ["dragleave", "drop"].forEach(name => {
      uploadZone.addEventListener(name, () => uploadZone.classList.remove("highlight"), false);
    });

    // Capture files dropped explicitly inside the zone target frame
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
      e.preventDefault(); // Turn off standard full page refresh executions

      const isEditMode = form.dataset.mode === "edit";
      const entryId = form.dataset.entryId;

      // Select endpoints configurations matching workflow patterns
      const requestUrl = isEditMode ? `/api/entry/${entryId}` : "/api/entry";
      const requestMethod = isEditMode ? "PUT" : "POST";

      const payload = {
        title: entryTitle.value,
        note: entryNote.value,
        date: entryDateElement.value,
        imagePaths: getImagesArray(),
      };

      try {
        console.log(JSON.stringify(payload));
        const response = await fetch(requestUrl, {
          method: requestMethod,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          // Send user straight to the dashboard month view context they were looking at
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

  if (!confirm("Are you absolute certain you want to permanently delete this entry?")) {
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
