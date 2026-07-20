function updateUrlQuerySilent(key, value) {
  const url = new URL(window.location.href);
  url.searchParams.set(key, value);
  window.history.replaceState({}, "", url);
}

document.addEventListener('DOMContentLoaded', () => {
  const entryDateElement = document.getElementById("entryDate");
  entryDateElement.addEventListener("change", () => {
    updateUrlQuerySilent("date", entryDateElement.value);
  })
})
