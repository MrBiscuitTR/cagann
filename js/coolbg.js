// Function to create raining text
function createRainingText() {
    const text = [
        "<HTML>", "Artificial Intelligence", "Machine Learning", "TensorFlow", "Matplotlib", "PyTorch", "Computer Vision", "OpenCV","JavaScript", "Python", "Java","TypeScript","React.JS", "Node.JS", "MongoDB", "SQL", "TSX", "CSS",
        "Git", "GitHub", "VS Code","Responsive design", "REST API", "Database", "Server", "Client", "Frontend", "Backend", "Full-Stack", "Web development", "Software development", "Computer Science", "Algorithms", "Data Structures", "Problem Solving", "Debugging", "Testing", "Code review", "Optimization", "Integration", "Automation", "Cyber Security", "Performance", "Scalability", "Reliability", "Efficiency", "Flexibility", "Innovation", "Productivity", "Code proficiency"
    ];
    const rainingText = document.querySelector('.raining-text');
    const textrandom = text.sort(() => Math.random() - 0.5); // Randomize the array

    textrandom.forEach((t, index) => {
        const span = document.createElement('span', { is: 'rain-text' });
        span.className = 'rain-text';
        span.innerText = t;
        span.style.position = 'absolute';
        span.style.fontSize = `calc(${Math.random() * 5}vmin + 12px)`; // Random font size
        span.style.color = `hsl(${Math.random() * 360}, 100%, 75%)`; // Random color
        // Random horizontal position at least 10vw from the edges
        span.style.margin = `0 ${Math.random() * 10}vw 0 ${Math.random() * 90}vw`;
        span.style.animation = `rain ${Math.random() * 2 + 2}s linear ${index * 0.2}s infinite`; // Customize animation duration and delay
        span.style.opacity = 0; // Initially invisible
        rainingText.appendChild(span);
    });

}
createRainingText();
