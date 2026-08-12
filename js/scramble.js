// The letter-scramble effect. This is what all the data-value="..." attributes
// scattered around the HTML were for -- the old version in scrollReveal.js
// queried ".reveal active" (missing a dot, so it meant "an <active> element
// inside .reveal") and therefore never matched anything and never ran once.
//
// data-value holds the real text. We scramble towards it and always land back
// on exactly that string, so nothing can end up permanently mangled.
//
// Where it runs, and why only there:
//   - nav links: on hover/focus. short words, feels good, and it only ever
//     happens because someone pointed at it.
//   - section headings (About me / Skills / Certifications / ...): once, the
//     first time they scroll into view. once, not every time -- re-running on
//     every scroll past was going to be genuinely irritating.
//   - NOT the h1, NOT body copy. Long text looks like a broken page, not an
//     effect, and the h1 is the single most important thing on here for search.
//
// SEO guard: heading scrambles don't start until a real person has scrolled,
// clicked, tapped or typed. Googlebot renders the page and snapshots the DOM at
// some arbitrary moment; if that moment landed mid-scramble it would index
// "Sk#lLs" as my heading. Bots don't fire pointer/wheel/key events, so gating on
// one means the crawler always sees the clean text. Hover scrambles are safe by
// definition for the same reason.

(() => {
  const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  const MAX_LEN = 32;      // anything longer reads as broken, not stylish
  const TICK_MS = 30;
  const REVEAL_RATE = 1 / 3;   // characters locked in per tick

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const running = new WeakMap();

  function scramble(el) {
    const target = el.dataset.value;
    if (!target || target.length > MAX_LEN) return;

    clearInterval(running.get(el));

    let frame = 0;
    const id = setInterval(() => {
      el.textContent = target
        .split("")
        .map((ch, i) => {
          if (i < frame) return target[i];
          // leave spaces alone, otherwise the word boundaries jump around
          if (ch === " ") return " ";
          return LETTERS[Math.floor(Math.random() * LETTERS.length)];
        })
        .join("");

      if (frame >= target.length) {
        clearInterval(running.get(el));
        running.delete(el);
        el.textContent = target;   // guarantee we finish on the real string
      }
      frame += REVEAL_RATE;
    }, TICK_MS);

    running.set(el, id);
  }

  // --- nav links: hover / keyboard focus ---------------------------------
  document.querySelectorAll(".header-nav nav a[data-value]").forEach((link) => {
    link.addEventListener("mouseenter", () => scramble(link));
    link.addEventListener("focus", () => scramble(link));
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

  const seen = new WeakSet();
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting || seen.has(entry.target)) continue;
        seen.add(entry.target);
        observer.unobserve(entry.target);
        if (human) scramble(entry.target);
        else pending.add(entry.target);
      }
    },
    { rootMargin: "0px 0px -60px 0px" }
  );

  headings.forEach((h) => observer.observe(h));
})();
