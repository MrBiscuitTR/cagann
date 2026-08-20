// Blinking terminal caret on whichever heading is nearest the middle of the
// screen. Exactly one at a time -- every heading blinking at once would be
// unbearable, and a caret on something half off-screen looks like a bug.
//
// The caret itself is CSS (.caret-host::after in style-main.css), drawn as a
// box rather than a "▍" character on purpose: that glyph isn't in the font
// subset, so it'd render as tofu. All this file does is decide who wears it.
//
// Space for it is reserved on every candidate at all times (opacity 0 when
// inactive), so handing it from one heading to the next doesn't nudge any text
// sideways. Learned that one from the nav scramble.
//
// Plays nicely with scramble.js: that turns an h2 into ghost + absolutely
// positioned copy, and this ::after simply lands after the ghost, i.e. at the
// end of the text, which is where it belongs.
//
// It also WAITS for it. scramble.js marks a heading .scramble-pending until the
// letters settle, then fires scramble:done. A cursor blinking next to text
// that's still churning looks like two effects arguing. Headings that never
// scramble (every h1, and everything when prefers-reduced-motion is on) are
// never marked pending, so they're eligible immediately.

(() => {
  // Section h2s ONLY. It used to include every h1 as well and it just didn't
  // look right on them -- an h1 is a title, not a prompt, and a cursor after
  // my own name read as unfinished rather than live.
  // Also deliberately NOT .old-cvs h2 or .info-panel h2: those are small
  // uppercase labels and a cursor on them looks like a glitch.
  //
  // Consequence worth knowing: right now only index.html has any of these, so
  // this script early-returns everywhere else. It stays loaded on every page
  // anyway because the head is shared and identical across all of them, and
  // because the commented-out security section (and anything else I add later)
  // will be picked up with no wiring.
  const SELECTOR = ".container-text h2";

  const heads = Array.from(document.querySelectorAll(SELECTOR));
  if (!heads.length) return;   // nothing to do on pages without section headings

  heads.forEach((el) => el.classList.add("caret-host"));

  let current = null;
  let queued = false;

  function pick() {
    queued = false;
    const middle = window.innerHeight / 2;
    let best = null;
    let bestDistance = Infinity;

    for (const el of heads) {
      // still mid-scramble, not eligible yet
      if (el.classList.contains("scramble-pending")) continue;

      const box = el.getBoundingClientRect();
      // ignore anything not actually on screen
      if (box.bottom < 0 || box.top > window.innerHeight) continue;
      const distance = Math.abs((box.top + box.bottom) / 2 - middle);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = el;
      }
    }

    if (best === current) return;
    if (current) current.classList.remove("has-caret");
    current = best;
    if (current) current.classList.add("has-caret");
  }

  // rAF-throttled: scroll fires far more often than the screen repaints, and
  // getBoundingClientRect forces layout, so doing this per event would be the
  // same mistake the old scrollReveal made.
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(pick);
  }

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule, { passive: true });
  // re-run as soon as a heading settles, or the caret wouldn't appear until the
  // next scroll event
  document.addEventListener("scramble:done", schedule);
  pick();
})();
