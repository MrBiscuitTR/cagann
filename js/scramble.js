// The letter-scramble effect. This is what all the data-value="..." attributes
// scattered around the HTML were for -- the old version in scrollReveal.js
// queried ".reveal active" (missing a dot, so it meant "an <active> element
// inside .reveal") and therefore never matched anything and never ran once.
//
// Where it runs, and why only there:
//   - nav links: on hover, and on keyboard focus. Short words, feels good.
//   - section headings (About me / Skills / Certifications / ...): once, the
//     first time they scroll into view. Once, not every time -- re-running on
//     every scroll past was going to be genuinely irritating.
//   - NOT the h1, NOT body copy. Long text looks like a broken page rather than
//     an effect, and the h1 is the most important thing on here for search.
//
// Two things this has to avoid, both learned the hard way:
//
// 1. LAYOUT SHIFT. Random letters aren't as wide as the real ones, so naively
//    rewriting textContent resized the element 30x a second: the nav jittered
//    sideways on desktop and wrapped/unwrapped on mobile, which made the whole
//    header bounce. Fixed by splitting each target into a hidden "ghost" span
//    holding the real text (that's what reserves the space, and it never
//    changes) plus an absolutely-positioned copy that does the animating. See
//    .scramble-lock in style-main.css.
//
// 2. FIRING ON TOUCH. Tapping a nav link on a phone fires focus, so every
//    navigation kicked off a scramble on the way out. Hover is now bound only
//    on real pointer devices, and the focus handler checks :focus-visible so it
//    responds to the keyboard but not to taps.
//
// SEO guard: heading scrambles don't start until a real person has scrolled,
// clicked, tapped or typed. Googlebot renders the page and snapshots the DOM at
// some arbitrary moment; if that landed mid-scramble it would index "Sk#lLs" as
// my heading. Bots don't fire pointer/wheel/key events.

(() => {
  const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  const MAX_LEN = 32;        // longer than this reads as broken, not stylish
  const TICK_MS = 28;
  const TOTAL_TICKS = 14;    // see below -- this is what makes it length-independent
  const CARET_GAP_MS = 500;  // breathing room between the letters settling and
                             // caret.js putting a cursor there. Without it the
                             // two effectively overlap and it reads as busy.

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const running = new WeakMap();

  // Split an element into ghost + animating copy. Returns the copy, or null if
  // the text isn't a sensible thing to scramble.
  //
  // Note it takes the target string from the element's own text, NOT from
  // data-value: the h2 says "About me" while data-value says "About Me", and
  // the visible wording is the one that's correct.
  function prepare(el) {
    const text = el.textContent.trim();
    if (!text || text.length > MAX_LEN) return null;

    const ghost = document.createElement("span");
    ghost.className = "scramble-ghost";
    ghost.setAttribute("aria-hidden", "true");
    ghost.textContent = text;

    const live = document.createElement("span");
    live.className = "scramble-text";
    live.textContent = text;

    el.textContent = "";
    el.append(ghost, live);
    el.classList.add("scramble-lock");

    return { host: el, live, ghost, text };
  }

  // Tell the world this heading has finished resolving. caret.js waits for it:
  // a cursor blinking beside text that's still churning through random letters
  // reads as two effects fighting each other, so the caret holds off.
  // Called on the bail-out path too -- if the scramble never runs, the caret
  // must not stay blocked forever.
  function settle(target) {
    const host = target.host;
    if (!host || !host.classList.contains("scramble-pending")) return;
    // The delay lives here rather than in caret.js on purpose: .scramble-pending
    // is what gates the caret, so the gate has to stay shut for the whole gap.
    // If caret.js just deferred its own timer instead, any scroll during those
    // 500ms would call pick(), find nothing pending, and pop the caret in early.
    setTimeout(() => {
      host.classList.remove("scramble-pending");
      host.dispatchEvent(new CustomEvent("scramble:done", { bubbles: true }));
    }, CARET_GAP_MS);
  }

  function scramble(target) {
    if (!target) return;
    const { live, ghost, text } = target;

    // If the real text already wraps onto more than one line (a long heading on
    // a very narrow phone), skip it. The animating copy is white-space: nowrap,
    // so on a wrapped heading it would sit as one long line straddling a
    // two-line box -- which looks broken rather than clever. One rect = one
    // line. Reading this forces layout, but only once per scramble, not per tick.
    if (ghost.getClientRects().length > 1) {
      live.textContent = text;
      settle(target);
      return;
    }

    clearInterval(running.get(live));

    // Duration is FIXED at ~TOTAL_TICKS * TICK_MS (about 400ms), whatever the
    // length. It used to be a fixed 1/3 of a character per tick, which meant the
    // run time scaled with the text: "Skills" took ~0.5s but "Some of My
    // Projects" took 1.7s and just felt broken. Deriving the rate from the
    // length instead means every heading resolves in the same beat -- long ones
    // simply lock in more characters per tick.
    const rate = text.length / TOTAL_TICKS;

    let frame = 0;
    const id = setInterval(() => {
      live.textContent = text
        .split("")
        .map((ch, i) => {
          if (i < frame) return text[i];
          // leave spaces alone or the word boundaries jump around
          if (ch === " ") return " ";
          return LETTERS[Math.floor(Math.random() * LETTERS.length)];
        })
        .join("");

      if (frame >= text.length) {
        clearInterval(running.get(live));
        running.delete(live);
        live.textContent = text; // always finish on the real string
        settle(target);
      }
      frame += rate;
    }, TICK_MS);

    running.set(live, id);
  }

  // --- nav links ---------------------------------------------------------
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  document.querySelectorAll(".header-nav nav a[data-value]").forEach((link) => {
    const target = prepare(link);
    if (!target) return;

    // the accessible name shouldn't turn to gibberish mid-animation
    if (!link.hasAttribute("aria-label")) link.setAttribute("aria-label", target.text);

    if (canHover) link.addEventListener("mouseenter", () => scramble(target));

    link.addEventListener("focus", () => {
      // :focus-visible is true for keyboard focus and false for a tap, which is
      // exactly the distinction we want. Older browsers just skip it.
      try {
        if (link.matches(":focus-visible")) scramble(target);
      } catch { /* :focus-visible unsupported, no scramble on focus */ }
    });
  });

  // --- section headings: once, on first reveal, after real interaction ----
  const headings = document.querySelectorAll(".container-text h2[data-value]");
  if (!headings.length || !("IntersectionObserver" in window)) return;

  let human = false;
  const pending = new Set();

  function wakeUp() {
    human = true;
    pending.forEach(scramble);
    pending.clear();
  }

  ["pointerdown", "wheel", "touchstart", "keydown", "scroll"].forEach((evt) =>
    window.addEventListener(evt, wakeUp, { once: true, passive: true })
  );

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const target = entry.target._scramble;
        observer.unobserve(entry.target);
        if (!target) continue;
        if (human) scramble(target);
        else pending.add(target);
      }
    },
    { rootMargin: "0px 0px -60px 0px" }
  );

  headings.forEach((h) => {
    const target = prepare(h);
    if (!target) return;
    // caret.js won't put a cursor on anything still carrying this class.
    // Headings only -- nav links scramble on hover and never host a caret.
    h.classList.add("scramble-pending");
    h._scramble = target;
    observer.observe(h);
  });
})();
