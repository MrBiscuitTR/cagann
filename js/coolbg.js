// Decorative "raining text" behind the hero.
// The container is aria-hidden in the markup, so this is purely visual.

(() => {
  const rainingText = document.querySelector(".raining-text");
  if (!rainingText) return;

  // Respect the user's motion preference — 44 infinitely animating elements is
  // exactly the kind of thing this setting exists for.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const text = [
    "<HTML>", "Artificial Intelligence", "Applied AI", "Machine Learning", "JavaScript", "Python", "Java", "TypeScript", "React.JS", "Node.JS", "MongoDB", "SQL", "CSS",
    "Git", "Kali Linux", "Ghidra", "C++", "Operating Systems", "Active Directory", "REST API", "Database", "Frontend", "Backend", "Full-Stack", "Web Development", "Software development", "Computer Science", "Debugging", "Testing", "Code Review", "Automation", "Bug Bounty", "Reverse Engineering", "Cybersecurity", "Penetration Testing", "Ethical Hacking", "CTF", "Hack The Box", "AI", "Assembly", "Docker", "Innovation", "Open Source", "Self-hosting", "Homelab", "Red Teaming", "Blue Teaming", "Linux", "Windows", "Networking", "Burp Suite", "Metasploit", "Wireshark", "Forensics" ,"Fuzzing"
  ];

  // Fisher-Yates — Array.sort with a random comparator is biased.
  for (let i = text.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [text[i], text[j]] = [text[j], text[i]];
  }

  const randomMargin = () =>
    `0vw ${Math.random() * 5 + 2}vw 0 ${Math.random() * 80 + 2}vw`;

  // was hsl(random 0-360, 100%, 75%) -- 44 words in 44 fully-saturated colours,
  // which read as noise rather than atmosphere and fought the hero art.
  // One hue family around the accent, softer, semi-transparent.
  const randomColor = () =>
    `hsla(${184 + Math.random() * 24}, 68%, ${58 + Math.random() * 16}%, 0.5)`;

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
    // slower than it was (was 2-4s); it's background texture, not the point
    span.style.animation = `rain ${Math.random() * 3 + 3.5}s linear ${index * 0.25}s infinite`;
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
