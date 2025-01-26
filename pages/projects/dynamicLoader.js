// load the corresponding project page based on url
// if the url is empty, redirect to the first project page
// if the url is not empty but not found, redirect to 404 page

// image slider. buttons on the right and left of the slider (both sides of the page), and the images are in the middle. images dont fit the screen -> scroll with buttons or with mouse/hand. images will have a modal window to show the full image.
var scrollY = 100;
const modal = document.querySelector('.modal');
function openModal(src) {
    //get distance scrolled from the top   
    
    console.log(scrolledAt);
    // creates a modal window with the image that was clicked
    const img = document.createElement('img');
    img.src = src;
    modal.innerHTML = '';
    modal.appendChild(img);
    modal.style.display = 'block';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.height = '100vh';
    modal.classList.add('modal');

    document.body.style.position = 'fixed'; // prevent scrolling
    document.body.style.top = `-${scrolledAt}px`; // prevent scrolling
}

function closeModal() {
    modal.style.display = 'none';
    modal.innerHTML = '';

    document.body.style.position = ''; // remove the fixed position
    document.body.style.top = ''; // remove the top style to allow scrolling
    // prevent going to the top of the page when closing the modal
    window.scrollTo(0, scrolledAt);

}

// END MODAL
// START SLIDER

var screenshotSlider = document.querySelector('.screenshots');
function scrollSlider(direction) {
    slider = screenshotSlider;
    const scrollAmount = 250;
    // add animation to the scroll make it smooth
    if (direction === 'left') {
        slider.style.scrollBehavior = 'smooth';
        slider.scrollLeft -= scrollAmount;
        slider.style.scrollBehavior = 'auto';
    } else if (direction === 'right') {
        slider.style.scrollBehavior = 'smooth';
        slider.scrollLeft += scrollAmount;
        slider.style.scrollBehavior = 'auto';
    }
}
// scroll with mouse drag. when mouse is up, no longer drag the slider, and dont open modal.
let isDown = false;
screenshotSlider.addEventListener('mousedown', function(e) {
    e.preventDefault();
    isDown = true;
    let startX = e.pageX - screenshotSlider.offsetLeft;
    let scrollLeft = screenshotSlider.scrollLeft;

    screenshotSlider.addEventListener('mouseleave', function(e) {
        e.preventDefault();
        // wait 0.02s before setting isDown to false, so the mouseup event can be triggered
        setTimeout(() => {
            isDown = false;
        }, 20);
    });
    screenshotSlider.addEventListener('mouseup', function(e) {
        e.preventDefault();
        setTimeout(() => {
            isDown = false;
        }, 20);
    });
    screenshotSlider.addEventListener('mousemove', function(e) {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - screenshotSlider.offsetLeft;
        const walk = (x - startX) * 2; //scroll-fast
        screenshotSlider.scrollLeft = scrollLeft - walk;
    });
});

var screenshots = document.querySelectorAll('.screenshot');
var current = 0;

function showScreenshot(index) {
    screenshots[current].classList.remove('active');
    screenshots[index].classList.add('active');
    current = index;
}


document.addEventListener('click', function(e) {
    if (e.target.classList.contains('prev')) {
        scrollSlider('left');
    } else if (e.target.classList.contains('next')) {
        scrollSlider('right');
    } else if (e.target.classList.contains('screenshot')) {
        e.preventDefault();
        scrolledAt = window.pageYOffset;
        openModal(e.target.src);
    } else if (e.target.classList.contains('modal')) {
        closeModal();
    } 
});
    


const projectFromURL = window.location.pathname.split('/').pop();
const project = projectFromURL ? projectFromURL : 'pages/projects/index.html';
const projectPath = `pages/projects/${project}/index.html`;

// collapsibles

var coll = document.getElementsByClassName("collapsible");
var i;
console.log(coll);
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

