const revealevent = new Event("reveal");

function reveal() {
  var reveals = document.querySelectorAll(".reveal");

  for (var i = 0; i < reveals.length; i++) {
    var windowHeight = window.innerHeight;
    var elementTop = reveals[i].getBoundingClientRect().top;
    var elementVisible = 80;

    if (elementTop < windowHeight - elementVisible) {
      reveals[i].classList.add("active");
      reveals[i].dispatchEvent(revealevent);
    } else {
      reveals[i].classList.remove("active");
    }
  }
}

window.addEventListener("scroll", reveal);

// cooler reveal effect (on click on text)
const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

document.querySelectorAll(".reveal active").forEach((h2, index) => {
  let iteration = 0;
  let interval = null;

  h2.addEventListener("reveal", (event) => {
    console.log("reveal event triggered") 
    clearInterval(interval);

    interval = setInterval(() => {
      h2.innerText = h2.innerText
       .split("")
       .map((letter, index) => {
          if (index < iteration) {
            return h2.dataset.value[index];
          }

          return letters[Math.floor(Math.random() * letters.length)];
        })
       .join("");

      if (iteration >= h2.dataset.value.length) {
        clearInterval(interval);
      }

      iteration += 1 / 3;
    }, 20 + (index * 5)); // add a small delay for each element to avoid simultaneous execution
  });
});