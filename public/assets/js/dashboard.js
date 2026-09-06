function dateToString(date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const pad = (n) => n.toString().padStart(2, "0");

// Gate entrance animation styling on JS availability so cards never flash (or
// get stuck hidden) without JS.
document.documentElement.classList.add("js");

document.addEventListener("DOMContentLoaded", () => {
  const yearFromQuery = () => {
    const yearParam = new URLSearchParams(window.location.search).get("year");
    return yearParam ? Number(yearParam) : new Date().getFullYear();
  };

  // Resolve a short-form hash: #MM-DD seeks to that day's card, #MM seeks to
  // the month's header. Both use the year from ?year (or the current year).
  const stripped = decodeURIComponent(
    (window.location.hash || `#${dateToString(new Date()).slice(5)}`).substring(1)
  );
  let target = null;
  let targetBlock = "center";
  let seekerMonth = null;

  const dayMatch = stripped.match(/^(\d{2})-(\d{2})$/);
  const monthMatch = stripped.match(/^(\d{2})$/);

  if (dayMatch) {
    seekerMonth = Number(dayMatch[1]) - 1;
    target = document.getElementById(`${yearFromQuery()}-${dayMatch[1]}-${dayMatch[2]}`);
  } else if (monthMatch) {
    seekerMonth = Number(monthMatch[1]) - 1;
    target = document.querySelector(`.month-section[data-month="${seekerMonth}"]`);
    targetBlock = "start";
  }

  if (target) {
    setTimeout(() => {
      target.scrollIntoView({
        behavior: "smooth",
        block: targetBlock,
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

  // Year/Month seeker
  const seeker = document.querySelector(".seeker");
  if (seeker) {
    const monthValue = seeker.querySelector(".seeker-value--month");
    const nextMonthButton = seeker.querySelector('[data-month-step="1"]');
    const updateMonthNextLock = (year, month) => {
      if (nextMonthButton) {
        nextMonthButton.disabled = year === new Date().getFullYear() && month === 11;
      }
    };

    // Keep the label in sync with the month the page loaded on.
    if (seekerMonth !== null) {
      monthValue.textContent = MONTH_NAMES[seekerMonth];
      seeker.dataset.month = String(seekerMonth);
      updateMonthNextLock(Number(seeker.dataset.year), seekerMonth);
    }

    // Year +/- : stay on the same month when switching years.
    seeker.querySelectorAll('a[href^="/?year="]').forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        const month = Number(seeker.dataset.month);
        window.location.href = `${link.getAttribute("href")}#${pad(month + 1)}`;
      });
    });

    // Month +/- : seek to the month's header within the rendered year, or
    // full-page navigate when crossing years or viewing a single month.
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

        if (seeker.dataset.mode === "month") {
          window.location.href = `/?year=${year}&month=${month + 1}#${pad(month + 1)}`;
          return;
        }
        if (year !== originalYear) {
          window.location.href = `/?year=${year}#${pad(month + 1)}`;
          return;
        }

        const header = document.querySelector(`.month-section[data-month="${month}"]`);
        if (header) {
          history.pushState(null, "", `#${pad(month + 1)}`);
          header.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        monthValue.textContent = MONTH_NAMES[month];
        seeker.dataset.month = String(month);
        updateMonthNextLock(year, month);
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
