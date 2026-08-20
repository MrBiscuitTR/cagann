// Small DOM housekeeping that has to happen on every page.
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

  // Image fallbacks for the icons I hotlink off my own subdomains: if the
  // remote one 404s, swap in a local copy.
  //
  // This used to be an inline onerror="" attribute in the markup, which the CSP
  // blocks (script-src-attr), so on the live site the fallback silently never
  // fired -- the image just stayed broken. Doing it with a listener keeps the
  // policy strict instead of adding 'unsafe-hashes' for one image.
  document.querySelectorAll("img[data-fallback]").forEach((img) => {
    const swap = () => {
      // guard against a loop if the fallback is missing too
      if (img.dataset.fallbackUsed) return;
      img.dataset.fallbackUsed = "1";
      img.src = img.dataset.fallback;
    };
    img.addEventListener("error", swap);
    // this script is deferred, so the image may already have failed by now
    if (img.complete && img.naturalWidth === 0) swap();
  });
})();
