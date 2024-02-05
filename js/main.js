//server request template test
const rq = new XMLHttpRequest();
function serverRequest() {
  rq.open("GET", "http://92.44.187.183:80");
  rq.send();
    rq.onload = () => {
        if (rq.status === 200) {
        console.log(rq.responseText);
        const data = JSON.parse(rq.responseText);
        const aboutdiv = document.getElementById("about");
        aboutdiv.appendChild(document.createTextNode(data.name));
        } else {
        console.log("Error: " + rq.status);
        }
    };
}

window.onload = serverRequest;