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
        span.style.fontSize = `calc(${Math.random() * 4}vmin + 16px)`; // Random font size
        span.style.color = `hsl(${Math.random() * 360}, 100%, 75%)`; // Random color
        // Random horizontal position at least 10vw from the edges
        span.style.margin = `0 ${Math.random() * 10}vw 0 ${Math.random() * 90}vw`;
        span.style.animation = `rain 3s linear ${index * 0.2}s infinite`; // Customize animation duration and delay
        span.style.opacity = 0; // Initially invisible
        rainingText.appendChild(span);
    });

}
createRainingText();
