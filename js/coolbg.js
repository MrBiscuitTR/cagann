// Decorative "raining text" behind the hero.
// The container is aria-hidden in the markup, so this is purely visual.

(() => {
  const rainingText = document.querySelector(".raining-text");
  if (!rainingText) return;

  // Respect the user's motion preference — 44 infinitely animating elements is
  // exactly the kind of thing this setting exists for.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const text = [
    "<HTML>", "Artificial Intelligence", "Machine Learning", "TensorFlow", "Matplotlib", "PyTorch", "Computer Vision", "OpenCV", "JavaScript", "Python", "Java", "TypeScript", "React.JS", "Node.JS", "MongoDB", "SQL", "TSX", "CSS",
    "Git", "Kali Linux", "Responsive design", "REST API", "Database", "Frontend", "Backend", "Full-Stack", "Web development", "Software development", "Computer Science", "Algorithms", "Data Structures", "Collaboration", "Problem Solving", "Debugging", "Testing", "Code review", "Optimization", "Automation", "Cyber Security", "Performance", "Efficiency", "Flexibility", "Innovation", "Productivity"
  ];

  // Fisher-Yates — Array.sort with a random comparator is biased.
  for (let i = text.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [text[i], text[j]] = [text[j], text[i]];
  }

  const randomMargin = () =>
    `0vw ${Math.random() * 5 + 2}vw 0 ${Math.random() * 80 + 2}vw`;
  const randomColor = () => `hsl(${Math.random() * 360}, 100%, 75%)`;

  // Build off-document so the whole batch costs one layout pass, not 44.
  const fragment = document.createDocumentFragment();

  text.forEach((t, index) => {
    const span = document.createElement("span");
    span.className = "rain-text";
    span.innerText = t;
    span.style.position = "absolute";
    span.style.fontSize = `calc(${Math.random() * 5}vmin + 12px)`;
    span.style.color = randomColor();
    // Random horizontal position, kept clear of the edges.
    span.style.margin = randomMargin();
    span.style.animation = `rain ${Math.random() * 2 + 2}s linear ${index * 0.2}s infinite`;
    span.style.opacity = 0; // the keyframes take over from here
    span.style.zIndex = -1;
    span.style.left = 0;

    // Re-randomise position/colour each time the drop restarts.
    span.addEventListener("animationiteration", () => {
      span.style.margin = randomMargin();
      span.style.color = randomColor();
    });

    fragment.appendChild(span);
  });

  rainingText.appendChild(fragment);

  // Stop burning CPU/battery once the hero has scrolled out of view.
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(
      ([entry]) => rainingText.classList.toggle("paused", !entry.isIntersecting)
    ).observe(rainingText);
  }
})();
