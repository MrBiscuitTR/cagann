// on click on any "expandable" element, toggle the class "expanded" or "collapsed"
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('expandable')) {
    e.target.classList.toggle('expanded');
    if (e.target.classList.contains('expanded')) {
      e.target.classList.remove('collapsed');
    } else {
      e.target.classList.add('collapsed');
    }
  }
});

// document.addEventListener("DOMContentLoaded", () => {
//   const projects = document.querySelectorAll(".column .project .project-text p");

//   projects.forEach((project) => {
//       const container = project.parentElement; // .project-text container
//       const containerHeight = container.offsetHeight;
//       const lineHeight = parseFloat(window.getComputedStyle(project).lineHeight);

//       // Calculate the maximum number of lines
//       const maxLines = Math.floor(containerHeight / lineHeight);

//       // Apply ellipsis programmatically
//       applyEllipsis(project, maxLines);
//   });

//   function applyEllipsis(element, maxLines) {
//       const originalText = element.textContent;
//       element.textContent = originalText;

//       while (element.scrollHeight > element.offsetHeight && maxLines > 0) {
//           element.textContent = element.textContent.slice(0, -1);
//           element.textContent = element.textContent.trim() + "…";
//       }
//   }
// });

