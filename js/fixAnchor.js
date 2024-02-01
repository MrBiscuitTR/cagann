const goToAnchor = (anchor) => {
    console.log('goToAnchor');
    var targetDiv = document.getElementById(anchor);
    if (targetDiv) {
        var targetRect = targetDiv.getBoundingClientRect();
        var headerHeight = document.getElementById('header').offsetHeight;
        window.scrollTo({
            top: targetRect.top + window.scrollY - headerHeight - 50,
            behavior: 'smooth'
        });
    } else {
        console.log('targetDiv not found');
    }
}
window.addEventListener('load', () => {
    if (window.location.hash) {
        goToAnchor(window.location.hash.substring(1));
        window.location.clearHash = () => {
            history.pushState("", document.title, window.location.pathname + window.location.search);
        }
        window.location.clearHash();
    }
    
});
