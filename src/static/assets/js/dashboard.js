function dateToString(date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Gate entrance animation styling on JS availability so cards never flash (or
// get stuck hidden) without JS.
document.documentElement.classList.add("js");

document.addEventListener("DOMContentLoaded", () => {
  const id = decodeURIComponent((window.location.hash || `#${dateToString(new Date())}`).substring(1));
  const targetCard = document.getElementById(id);

  if (targetCard) {
    setTimeout(() => {
      targetCard.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 100);
  }

  // Staggered entrance animation each time an entry card enters the viewport.
  const entryObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const card = entry.target;
        const gallery = card.parentElement;
        const index = [...gallery.children].indexOf(card);
        card.style.setProperty("--d", `${Math.min(index * 16, 400)}ms`);
        card.classList.add("card-enter-anim");
        card.addEventListener("animationend", () => {
          card.classList.remove("card-enter-anim");
          card.classList.add("card-entered");
        }, { once: true });
        entryObserver.unobserve(card);
      }
    });
  }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });

  document.querySelectorAll(".entry-card").forEach((card) => entryObserver.observe(card));

  // Dim surrounding months while the current month is in view.
  // As the current month scrolls away, dimming fades out proportionally to
  // how far its center is from the viewport center.
  const wrapper = document.querySelector(".dashboard-wrapper");
  const currentMonthSection = document.querySelector(".month-section--current");

  if (wrapper && currentMonthSection) {
    let ticking = false;
    const update = () => {
      ticking = false;
      const rect = currentMonthSection.getBoundingClientRect();
      const viewportHeight = window.innerHeight || 1;
      const half = viewportHeight / 2;
      const sectionCenter = rect.top + rect.height / 2;
      const delta = Math.abs(sectionCenter - half);
      const dim = Math.max(0, Math.min(1, 1 - (delta - half) / half));
      wrapper.style.setProperty("--dim", dim.toFixed(3));
    };
    const requestUpdate = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    update();
  }
});
