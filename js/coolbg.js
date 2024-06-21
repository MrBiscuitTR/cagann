// Function to create raining text
function createRainingText() {
    const text = [
        "<HTML>", "Artificial Intelligence", "Machine Learning", "TensorFlow", "Matplotlib", "PyTorch", "Computer Vision", "OpenCV","JavaScript", "Python", "Java","TypeScript","React.JS", "Node.JS", "MongoDB", "SQL", "TSX", "CSS",
        "Git", "Responsive design", "REST API", "Database", "Server", "Client", "Frontend", "Backend", "Full-Stack", "Web development", "Software development", "Computer Science", "Algorithms", "Data Structures", "Collaboration", "Problem Solving", "Debugging", "Testing", "Code review", "Optimization", "Integration", "Automation", "Cyber Security", "Performance", "Efficiency", "Flexibility", "Innovation", "Productivity"
    ];
    const rainingText = document.querySelector('.raining-text');
    const textrandom = text.sort(() => Math.random() - 0.5); // Randomize

    textrandom.forEach((t, index) => {
        const span = document.createElement('span', { is: 'rain-text' });
        span.className = 'rain-text';
        span.innerText = t;
        span.style.position = 'absolute';
        span.style.fontSize = `calc(${Math.random() * 5}vmin + 12px)`;
        span.style.color = `hsl(${Math.random() * 360}, 100%, 75%)`;
        // Random horizontal position at least 10vw from the edges
        span.style.margin = `0vw ${Math.random() * 5 +2}vw 0 ${Math.random() * 80 +2}vw`;
        span.style.animation = `rain ${Math.random() * 2 + 2}s linear ${index * 0.2}s infinite`; // Customize animation duration and delay
        span.style.opacity = 0; // Initially invisible
        span.style.zIndex = -1; // Behind the background
        span.style.left = 0;
        rainingText.appendChild(span);
        //when opacity reaches 0 because of the keyframes animation, set next horizontal location and color to random
        span.addEventListener('animationiteration', () => {
            span.style.margin = `0vw ${Math.random() * 5 +2}vw 0 ${Math.random() * 80 +2}vw`;
            span.style.color = `hsl(${Math.random() * 360}, 100%, 75%)`;
        });
    });

}
createRainingText();
