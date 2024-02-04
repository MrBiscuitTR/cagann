//server request template test
const rq = new XMLHttpRequest();
function serverRequest() {
  rq.open("GET", "http://localhost:8080/");
  rq.send();
    rq.onload = () => {
        if (rq.status === 200) {
        console.log(rq.responseText);
        } else {
        console.log("Error: " + rq.status);
        }
    };
}

window.onload = serverRequest;