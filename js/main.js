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

var coll = document.getElementsByClassName("collapsible");
var i;

for (i = 0; i < coll.length; i++) {
  coll[i].addEventListener("click", function() {
    this.classList.toggle("expanded");
    var content = this.nextElementSibling;
    if (content.style.maxHeight){
      content.style.maxHeight = null;
    } else {
      content.style.maxHeight = content.scrollHeight + "px";
    } 
  });
}