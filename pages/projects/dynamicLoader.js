// load the corresponding project page based on url
// if the url is empty, redirect to the first project page
// if the url is not empty but not found, redirect to 404 page

const projectFromURL = document.window.location.pathname.split('/').pop();
const project = projectFromURL ? projectFromURL : 'pages/projects/index.html';
const projectPath = `pages/projects/${project}/index.html`;

