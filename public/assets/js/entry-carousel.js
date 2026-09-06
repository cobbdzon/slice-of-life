document.addEventListener('DOMContentLoaded', () => {
  const slider = document.getElementById('carousel');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const counter = document.getElementById('carouselCounter');

  if (!slider) return;

  let isDown = false;
  let startX;
  let scrollLeft;
  let targetScrollLeft = 0;
  let animationFrameId = null;

  let heights = [];

  function calculateHeights() {
    heights = Array.from(slider.children).map(frame => {
      const img = frame.querySelector('img');
      if (!img) return 0;

      const containerWidth = slider.offsetWidth;
      if (img.naturalWidth > 0) {
        return (img.naturalHeight / img.naturalWidth) * containerWidth;
      }
      return frame.offsetHeight || 400; // Fallback
    });
  }

  function updateCarouselDimensions() {
    if (heights.length === 0) return;

    const width = slider.offsetWidth;
    if (width === 0) return;

    const scrollPos = slider.scrollLeft;

    const fractionalIndex = scrollPos / width;
    const baseIndex = Math.floor(fractionalIndex);
    const progress = fractionalIndex - baseIndex;

    let currentHeight;

    if (baseIndex >= heights.length - 1) {
      currentHeight = heights[heights.length - 1];
    } else {
      const h1 = heights[baseIndex];
      const h2 = heights[baseIndex + 1];
      currentHeight = h1 + (h2 - h1) * progress;
    }

    slider.style.height = `${currentHeight}px`;

    if (counter) {
      const roundedIndex = Math.round(fractionalIndex) + 1;
      counter.innerText = `${roundedIndex} / ${heights.length}`;
    }
  }

  function initDimensions() {
    calculateHeights();

    if (heights.length === 1) {
      const singleImg = slider.querySelector('.entry-hero-frame img');
      if (singleImg) {
        singleImg.style.objectFit = 'cover';
      }
    }

    updateCarouselDimensions();
  }

  window.addEventListener('resize', initDimensions);
  slider.addEventListener('scroll', updateCarouselDimensions);

  const firstImg = slider.querySelector('img');
  if (firstImg && firstImg.complete) {
    initDimensions();
  } else if (firstImg) {
    firstImg.addEventListener('load', initDimensions);
  }
  setTimeout(initDimensions, 300); // Safety net initialization timeout

  if (prevBtn && nextBtn) {
    prevBtn.addEventListener('click', () => {
      slider.scrollBy({ left: -slider.offsetWidth, behavior: 'smooth' });
    });
    nextBtn.addEventListener('click', () => {
      slider.scrollBy({ left: slider.offsetWidth, behavior: 'smooth' });
    });
  }

  function renderDrag() {
    if (!isDown) return;
    slider.scrollLeft = targetScrollLeft;
    animationFrameId = requestAnimationFrame(renderDrag);
  }

  slider.addEventListener('mousedown', (e) => {
    isDown = true;
    slider.classList.add('grabbing');
    slider.style.scrollSnapType = 'none';
    startX = e.pageX - slider.offsetLeft;
    scrollLeft = slider.scrollLeft;
    targetScrollLeft = scrollLeft;
    animationFrameId = requestAnimationFrame(renderDrag);
  });

  slider.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - slider.offsetLeft;
    const walk = (x - startX) * 1.2;
    targetScrollLeft = scrollLeft - walk;
  });

  function stopDragging() {
    if (!isDown) return;
    isDown = false;
    slider.classList.remove('grabbing');
    window.cancelAnimationFrame(animationFrameId);
    slider.style.scrollSnapType = 'x mandatory';

    const index = Math.round(slider.scrollLeft / slider.offsetWidth);
    slider.scrollTo({ left: index * slider.offsetWidth, behavior: 'smooth' });
  }

  slider.addEventListener('mouseleave', stopDragging);
  slider.addEventListener('mouseup', stopDragging);
});
