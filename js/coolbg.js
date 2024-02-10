// Function to create raining text
function createRainingText() {
    const text = [
        "<div>", "<span>", "<p>", "<h1>", "<a>", "<input>", "<button>","JavaScript", "Python", "Java","TypeScript","React.JS", "Node.JS", "MongoDB", "SQL", "HTML", "CSS",
        "Git", "GitHub", "VS Code","Responsive design", "RESTful API", "Database", "Server", "Client", "Frontend", "Backend", "Full-Stack"
    ];
    const rainingText = document.querySelector('.raining-text');
    const textrandom = text.sort(() => Math.random() - 0.5); // Randomize the array

    textrandom.forEach((t, index) => {
        const span = document.createElement('span');
        span.innerText = t;
        span.style.position = 'absolute';
        span.style.color = `hsl(${Math.random() * 360}, 100%, 75%)`; // Random color
        span.style.margin = `0px ${Math.random() * 5 +5}vw 0px ${Math.random() * 90 +5}vw`; // Random horizontal position
        span.style.animation = `rain 3s linear ${index * 0.1}s infinite`; // Customize animation duration and delay
        span.style.opacity = 1; // Initially invisible
        rainingText.appendChild(span);
  });

}
createRainingText();
