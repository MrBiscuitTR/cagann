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

