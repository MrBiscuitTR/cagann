// Keeps the two self-updating bits of copy current.
// Both have correct static values in the HTML, so crawlers and no-JS visitors
// still see sensible text — this just stops them going stale.
// (Previously done with document.write, which blocks the parser.)

(() => {
  const ageEl = document.getElementById("age");
  if (ageEl) {
    const birthDate = new Date("2006-10-12");
    ageEl.textContent = Math.floor(
      (Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    );
  }

  const yearEl = document.getElementById("current-year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
