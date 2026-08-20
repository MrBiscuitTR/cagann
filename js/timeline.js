// Timeline behaviour. Three jobs:
//
//   1. default open state -- expanded on a wide screen, collapsed on a narrow
//      one. Can not be CSS, because `open` is an attribute, not a style.
//   2. the open/close animation.
//   3. the rail fill and the active-node glow.
//
// The markup ships with `open` on every entry on purpose: with JavaScript off
// you get the whole timeline expanded and readable, which is the right failure.
// This file only ever CLOSES things. It also stops managing the state entirely
// once you click an entry yourself -- rearranging what someone just opened is
// infuriating.
//
// On the animation: <details> can not be transitioned in CSS in most browsers.
// ::details-content + interpolate-size only landed in the newest Chrome, and
// the grid-template-rows trick does not work either, because a closed <details>
// hides its content outright so there is nothing to transition. So the height
// is animated with the Web Animations API, which works everywhere.
//
// While that animation runs we recompute the rail on every frame. Otherwise the
// glow would sit still for the whole 260ms and then teleport to its new
// position the instant the entry finished opening.

(() => {
  const list = document.querySelector(".timeline");
  if (!list) return;

  const entries = Array.from(list.querySelectorAll(".timeline-entry"));
  if (!entries.length) return;

  const wide = window.matchMedia("(min-width: 760px)");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  const DURATION = 260;
  const EASING = "cubic-bezier(0.22, 0.61, 0.36, 1)";   // quick out, soft landing

  let userDecided = false;
  let applying = false;
  let animating = 0;
  let queued = false;

  // ---- rail fill + active node -------------------------------------------

  // vertical centre of a node inside its entry. Defined in the CSS as
  // --node-center-y so the two can't drift apart.
  function nodeCenterY() {
    const v = parseFloat(getComputedStyle(list).getPropertyValue("--node-center-y"));
    return Number.isFinite(v) ? v : 21;
  }

  function update() {
    queued = false;
    const middle = window.innerHeight / 2;
    const offset = nodeCenterY();

    // which node is nearest the middle of the screen
    let best = null;
    let bestDistance = Infinity;
    for (const entry of entries) {
      const box = entry.getBoundingClientRect();
      if (box.bottom < 0 || box.top > window.innerHeight) continue;
      // measure from the node, not the entry centre -- an open entry is tall
      // and its centre drifts a long way down
      const distance = Math.abs(box.top + offset - middle);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = entry;
      }
    }
    for (const entry of entries) {
      entry.classList.toggle("is-active", entry === best);
    }

    // Fill the rail down to that node, in PIXELS relative to the list.
    // offsetTop is measured against .timeline (it's position: relative), so this
    // is a pure content measurement -- nothing about the viewport gets into it.
    // The old version derived a percentage from the viewport centre, which
    // pinned the glowing end to the middle of the screen and made it drift
    // whenever the list height changed or the browser adjusted scroll anchoring.
    let fill;
    if (best) {
      fill = best.offsetTop + offset;
    } else {
      // section entirely off-screen: full if we're past it, empty if above it
      const box = list.getBoundingClientRect();
      fill = box.bottom < 0 ? list.offsetHeight : 0;
    }
    list.style.setProperty("--timeline-fill", fill.toFixed(1) + "px");
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  }

  // keep the rail glued to the content while a height animation is in flight
  function follow() {
    if (animating > 0) {
      update();
      requestAnimationFrame(follow);
    }
  }

  // ---- open / close ------------------------------------------------------

  function animate(details, summary, opening) {
    const from = details.offsetHeight;
    if (opening) details.open = true;
    const to = opening ? details.offsetHeight : summary.offsetHeight;

    details.style.overflow = "hidden";
    const anim = details.animate(
      { height: [from + "px", to + "px"] },
      { duration: DURATION, easing: EASING }
    );

    if (animating === 0) requestAnimationFrame(follow);
    animating += 1;

    const done = () => {
      animating -= 1;
      if (!opening) details.open = false;
      details.style.overflow = "";
      details.style.height = "";
      update();
    };
    anim.onfinish = done;
    anim.oncancel = () => { animating -= 1; };
    return anim;
  }

  for (const entry of entries) {
    const details = entry.querySelector("details");
    if (!details) continue;
    const summary = details.querySelector("summary");
    if (!summary) continue;

    summary.addEventListener("click", (event) => {
      userDecided = true;
      if (reduced.matches) return;      // let the browser just snap it
      event.preventDefault();           // we drive the state ourselves

      if (details._anim) details._anim.cancel();
      details._anim = animate(details, summary, !details.open);
    });
  }

  // ---- default state -----------------------------------------------------

  function applyDefaultState() {
    if (userDecided) return;
    applying = true;
    for (const entry of entries) {
      const details = entry.querySelector("details");
      if (!details) continue;
      // data-always-open stays expanded at every width. It's on the newest
      // entry, which is the one thing a visitor should never have to tap open.
      details.open = details.hasAttribute("data-always-open") ? true : wide.matches;
    }
    // setting .open fires `toggle` asynchronously, so clear the guard after the
    // events have drained rather than immediately
    requestAnimationFrame(() => { applying = false; });
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
