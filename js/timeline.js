// Timeline behaviour. The expand/collapse itself is native <details> -- this
// only decides the DEFAULT state and draws the two scroll-driven effects.
//
// Default state: open on a wide screen, closed on a narrow one. That can not be
// done in CSS, because `open` is an attribute rather than a style.
//
// Note the markup ships with `open` on every entry. That is deliberate: with
// JavaScript off you get the whole timeline expanded and readable, which is the
// right failure. This file only ever CLOSES things.
//
// Once you click an entry yourself, this stops touching the open state
// entirely -- rearranging what someone just opened is infuriating.
//
// Also here: the rail fills as you scroll, and the node nearest the middle of
// the screen lights up. That nearest-to-centre rule is the same one caret.js
// uses, so the two effects agree about where you are instead of disagreeing.

(() => {
  const list = document.querySelector(".timeline");
  if (!list) return;

  const entries = Array.from(list.querySelectorAll(".timeline-entry"));
  if (!entries.length) return;

  const wide = window.matchMedia("(min-width: 760px)");
  let userDecided = false;
  let applying = false;

  function applyDefaultState() {
    if (userDecided) return;
    applying = true;
    for (const entry of entries) {
      const d = entry.querySelector("details");
      if (d) d.open = wide.matches;
    }
    // setting .open fires `toggle` asynchronously, so clear the guard after
    // the events have drained rather than immediately
    requestAnimationFrame(() => { applying = false; });
  }

  let queued = false;

  function update() {
    queued = false;
    const rail = list.getBoundingClientRect();
    const middle = window.innerHeight / 2;

    const progress = rail.height
      ? Math.min(1, Math.max(0, (middle - rail.top) / rail.height))
      : 0;
    list.style.setProperty("--timeline-progress", progress.toFixed(4));

    let best = null;
    let bestDistance = Infinity;
    for (const entry of entries) {
      const box = entry.getBoundingClientRect();
      if (box.bottom < 0 || box.top > window.innerHeight) continue;
      // measure from the node near the entry top, not the entry centre -- an
      // open entry is tall and its centre drifts a long way down
      const distance = Math.abs(box.top + 26 - middle);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = entry;
      }
    }
    for (const entry of entries) {
      entry.classList.toggle("is-active", entry === best);
    }
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  }

  // `toggle` does not bubble, hence the capture phase
  list.addEventListener("toggle", () => {
    if (!applying) userDecided = true;
    schedule();
  }, true);

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule, { passive: true });
  wide.addEventListener("change", () => { applyDefaultState(); schedule(); });

  applyDefaultState();
  update();
})();
