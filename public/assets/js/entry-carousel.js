document.addEventListener('DOMContentLoaded', () => {
  const hero = document.querySelector('.entry-hero');
  const slider = document.getElementById('carousel');
  if (!hero || !slider) return;

  const counter = document.getElementById('carouselCounter');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const dots = Array.from(document.querySelectorAll('.carousel-dots__dot'));
  const expandBtn = document.getElementById('expandBtn');
  const slideCount = slider.children.length;
  if (slideCount === 0) return;

  const slideWidth = () => slider.offsetWidth || 1;
  const currentIndex = () => Math.max(0, Math.min(slideCount - 1, Math.round(slider.scrollLeft / slideWidth())));

  const update = () => {
    const index = currentIndex();
    const label = `${index + 1} / ${slideCount}`;
    if (counter) counter.textContent = label;
    dots.forEach((dot, i) => dot.classList.toggle('is-active', i === index));
  };

  const go = (direction) => {
    slider.scrollBy({ left: direction * slideWidth(), behavior: 'smooth' });
  };

  slider.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();

  prevBtn?.addEventListener('click', () => go(-1));
  nextBtn?.addEventListener('click', () => go(1));

  // Pointer drag for desktop. Tracking on window avoids pointer-capture
  // quirks; preventDefault stops the browser's native image drag and text
  // selection. Moves are coalesced into one scroll write per frame.
  let dragging = false;
  let startX = 0;
  let startScroll = 0;
  let targetScroll = 0;
  let frame = null;
  let snapTimer = null;

  const applyDrag = () => {
    slider.scrollLeft = targetScroll;
    frame = null;
  };

  const onMove = (event) => {
    if (!dragging) return;
    targetScroll = startScroll - (event.clientX - startX);
    if (frame === null) frame = requestAnimationFrame(applyDrag);
  };

  const onUp = () => {
    if (!dragging) return;
    dragging = false;
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onUp);
    if (frame !== null) {
      cancelAnimationFrame(frame);
      frame = null;
    }
    slider.scrollLeft = targetScroll;

    const index = Math.max(0, Math.min(slideCount - 1, Math.round(targetScroll / slideWidth())));
    slider.scrollTo({ left: index * slideWidth(), behavior: 'smooth' });

    // Re-enable snapping only after the smooth scroll has had time to settle;
    // doing it immediately makes the browser jump instead of animate.
    clearTimeout(snapTimer);
    snapTimer = setTimeout(() => {
      slider.classList.remove('is-grabbing');
      document.body.classList.remove('is-dragging-media');
    }, 500);
  };

  slider.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.preventDefault();
    clearTimeout(snapTimer);
    dragging = true;
    startX = event.clientX;
    startScroll = slider.scrollLeft;
    targetScroll = startScroll;
    slider.classList.add('is-grabbing');
    document.body.classList.add('is-dragging-media');
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  });

  slider.addEventListener('dragstart', (event) => event.preventDefault());
  slider.addEventListener('selectstart', (event) => event.preventDefault());

  // --- Expanded view -------------------------------------------------------
  // The very same carousel is promoted to a full-screen layer; no duplicate
  // image element or second set of controls to keep in sync.

  const setExpanded = (expanded) => {
    hero.classList.toggle('is-expanded', expanded);
    document.body.style.overflow = expanded ? 'hidden' : '';
    if (expandBtn) {
      expandBtn.setAttribute('aria-label', expanded ? 'Close full screen view' : 'View photo full screen');
      expandBtn.focus();
    }
  };

  expandBtn?.addEventListener('click', () => setExpanded(!hero.classList.contains('is-expanded')));

  document.addEventListener('keydown', (event) => {
    if (!hero.classList.contains('is-expanded')) return;
    if (event.key === 'Escape') {
      setExpanded(false);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      go(-1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      go(1);
    }
  });
});
