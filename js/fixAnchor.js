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
    }
}