// Reveal-on-scroll.
// Uses IntersectionObserver so we never read layout geometry during a scroll
// event — the old getBoundingClientRect() loop caused a forced reflow on every
// single scroll tick.

const revealevent = new Event("reveal");

(() => {
  const reveals = document.querySelectorAll(".reveal");
  if (!reveals.length) return;

  // No IntersectionObserver (very old browser): just show everything.
  if (!("IntersectionObserver" in window)) {
    reveals.forEach((el) => el.classList.add("active"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");
          entry.target.dispatchEvent(revealevent);
        } else {
          entry.target.classList.remove("active");
        }
      }
    },
    // Matches the old "80px before the bottom edge" trigger point.
    { rootMargin: "0px 0px -80px 0px" }
  );

  reveals.forEach((el) => observer.observe(el));
})();
