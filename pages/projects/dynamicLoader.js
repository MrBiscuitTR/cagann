// load the corresponding project page based on url
// if the url is empty, redirect to the first project page
// if the url is not empty but not found, redirect to 404 page

// image slider. buttons on the right and left of the slider (both sides of the page), and the images are in the middle. images dont fit the screen -> scroll with buttons or with mouse/hand. images will have a modal window to show the full image.
//event lsiteners for buttons and for scrolling

const slider = document.querySelector('.slider');
const modal = document.querySelector('.modal');

function openModal(src) {
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

    document.body.style.position = 'fixed';
    document.body.style.top = `-${window.scrollY}px`;
}

function closeModal() {
    modal.style.display = 'none';
    modal.innerHTML = '';

    document.body.style.position = '';
    // document.body.style.top = '';
}

function scrollSlider(direction) {
    const scrollAmount = 200;
    if (direction === 'left') {
        slider.scrollLeft -= scrollAmount;
    } else if (direction === 'right') {
        slider.scrollLeft += scrollAmount;
    }
}

document.addEventListener('click', function(e) {
    if (e.target.classList.contains('prev')) {
        scrollSlider('left');
    } else if (e.target.classList.contains('next')) {
        scrollSlider('right');
    } else if (e.target.classList.contains('screenshot')) {
        openModal(e.target.src);
    } else if (e.target.classList.contains('modal')) {
        closeModal();
    }
});
    


const projectFromURL = document.window.location.pathname.split('/').pop();
const project = projectFromURL ? projectFromURL : 'pages/projects/index.html';
const projectPath = `pages/projects/${project}/index.html`;

