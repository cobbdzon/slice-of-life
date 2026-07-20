function dateToString(date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

document.addEventListener("DOMContentLoaded", () => {
  let hash = window.location.hash;

  if (!hash) {
    hash = `#${dateToString(new Date())}`;
  }

  const id = decodeURIComponent(hash.substring(1));
  const targetCard = document.getElementById(id);

  if (targetCard) {
    setTimeout(() => {
      targetCard.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 100);
  }
});
