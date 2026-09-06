function dateToString(date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

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

  // Year/Month seeker: month +/- seeks within the rendered year via the
  // #YYYY-MM-01 anchor, or full-page navigates when crossing years or when
  // viewing a single month (?month=).
  const seeker = document.querySelector(".seeker");
  if (seeker) {
    const monthValue = seeker.querySelector(".seeker-value--month");
    const pad = (n) => n.toString().padStart(2, "0");

    seeker.querySelectorAll("[data-month-step]").forEach((button) => {
      button.addEventListener("click", () => {
        const originalYear = Number(seeker.dataset.year);
        let year = originalYear;
        let month = Number(seeker.dataset.month) + Number(button.dataset.monthStep);

        if (month < 0) {
          month = 11;
          year -= 1;
        } else if (month > 11) {
          month = 0;
          year += 1;
        }

        if (seeker.dataset.mode === "month" || year !== originalYear) {
          window.location.href = `/?year=${year}&month=${month + 1}#${year}-${pad(month + 1)}-01`;
          return;
        }

        const targetId = `${year}-${pad(month + 1)}-01`;
        const target = document.getElementById(targetId) ||
          document.querySelector(`.month-section[data-month="${month}"]`);
        if (target) {
          history.pushState(null, "", `#${targetId}`);
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        monthValue.textContent = MONTH_NAMES[month];
        seeker.dataset.month = String(month);
      });
    });
  }

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
