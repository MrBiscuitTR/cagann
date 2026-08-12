// Expandable skill groups.
// The triggers are plain divs in the markup, so we promote them to real
// buttons here (role/tabindex/aria-expanded + Enter & Space) rather than
// leaving them mouse-only.

(() => {
  const triggers = document.querySelectorAll(".collapsible");

  triggers.forEach((trigger) => {
    const content = trigger.nextElementSibling;
    if (!content) return;

    trigger.setAttribute("role", "button");
    trigger.setAttribute("tabindex", "0");
    trigger.setAttribute("aria-expanded", "false");

    const toggle = () => {
      const isOpen = trigger.classList.toggle("expanded");
      trigger.setAttribute("aria-expanded", String(isOpen));

      if (isOpen) {
        // An explicit pixel height lets the max-height transition actually run;
        // `fit-content` would snap open with no animation.
        content.style.maxHeight = `${content.scrollHeight}px`;
        content.style.border = "var(--widget-border)";
        content.style.padding = "0.5em";
      } else {
        content.style.maxHeight = null;
        content.style.border = null;
        content.style.padding = null;
      }
    };

    trigger.addEventListener("click", toggle);
    trigger.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggle();
      }
    });
  });
})();
