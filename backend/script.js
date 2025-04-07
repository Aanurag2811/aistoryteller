// Constants
const GENRES = [
    'adventure',
    'fantasy',
    'mystery',
    'sci-fi',
    'horror',
    'romance',
    'historical',
    'comedy',
    'poem',
    'nursery-rhyme'
];

const PORTS = [3002, 3003, 3004, 3005, 30021];

// DOM Elements
const storyForm = document.getElementById('storyForm');
const promptInput = document.getElementById('prompt');
const genreButtons = document.querySelectorAll('.genre-button');
const storyDisplay = document.querySelector('.story-display');
const storyContent = document.querySelector('.story-content');
const readAloudButton = document.getElementById('readAloudBtn');
const saveButton = document.querySelector('.save-button');
const errorMessage = document.querySelector('.error-message');
const dismissButton = document.querySelector('.dismiss-button');
const errorText = document.querySelector('.error-text');
const voiceSelect = document.getElementById('voice-select');
const speedSelect = document.getElementById('speed-select');

// State
let currentGenre = 'story';
let isReading = false;
let currentVoice = null;
let voices = [];

// Initialize speech synthesis
const speechSynthesis = window.speechSynthesis;

// Event Listeners
storyForm.addEventListener('submit', handleSubmit);
genreButtons.forEach(button => {
    button.addEventListener('click', () => handleGenreChange(button));
});

// Voice selection change handler
if (voiceSelect) {
    voiceSelect.addEventListener('change', (e) => {
        const selectedIndex = parseInt(e.target.value);
        currentVoice = voices[selectedIndex];
        if (isReading) {
            stopReading();
            startReading();
        }
    });
}

// Speed change handler
if (speedSelect) {
    speedSelect.addEventListener('change', () => {
        if (isReading) {
            stopReading();
            startReading();
        }
    });
}

// Read Aloud Button Event Listener
if (readAloudButton) {
    readAloudButton.addEventListener('click', () => {
        if (isReading) {
            stopReading();
        } else {
            startReading();
        }
    });
}

saveButton.addEventListener('click', saveStory);
dismissButton?.addEventListener('click', dismissError);

// Handle form submission
async function handleSubmit(e) {
    e.preventDefault();
    
    const prompt = promptInput.value.trim();
    if (!prompt) return;

    // Hide any existing error message
    if (errorMessage) {
        errorMessage.classList.add('hidden');
    }

    // Show loading state
    storyDisplay.classList.remove('hidden');
    storyContent.innerHTML = '<div class="loading-spinner"></div>';
    
    let success = false;
    
    // Try each port until one works
    for (const port of PORTS) {
        try {
            const response = await fetch(`http://localhost:${port}/api/story/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt,
                    genre: currentGenre,
                    isNurseryRhyme: currentGenre === 'nursery-rhyme',
                    isPoem: currentGenre === 'poem'
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data && data.content) {
                    if (currentGenre === 'nursery-rhyme') {
                        storyContent.innerHTML = formatNurseryRhymeContent(data.content);
                    } else if (currentGenre === 'poem') {
                        storyContent.innerHTML = formatPoemContent(data.content);
                    } else {
                        storyContent.innerHTML = formatStoryContent(data.content);
                    }
                    updateStoryMeta(data);
                    success = true;
                    break;
                }
            }
        } catch (error) {
            console.log(`Failed to connect to port ${port}`);
        }
    }
    
    // Only show error if all attempts failed
    if (!success) {
        showError('Unable to connect to the server. Please try again.');
    }
}

// Handle genre change
function handleGenreChange(button) {
    genreButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    currentGenre = button.dataset.genre;
}

// Format story content
function formatStoryContent(content) {
    if (!content) return '<p>No content generated</p>';
    const paragraphs = content.split('\n\n');
    return paragraphs
        .map(para => `<p>${para.trim()}</p>`)
        .join('');
}

// Format nursery rhyme content
function formatNurseryRhymeContent(content) {
    if (!content) return '<p>No content generated</p>';
    const lines = content.split('\n');
    return lines
        .map(line => `<p class="nursery-rhyme-line">${line.trim()}</p>`)
        .join('');
}

// Format poem content
function formatPoemContent(content) {
    if (!content) return '<p>No content generated</p>';
    const lines = content.split('\n');
    return lines
        .map(line => `<p class="poem-line">${line.trim()}</p>`)
        .join('');
}

// Update story meta information
function updateStoryMeta(data) {
    const metaContainer = document.querySelector('.story-meta');
    const wordCount = data.content.split(/\s+/).length;
    
    metaContainer.innerHTML = `
        <span><i class="fas fa-clock"></i> Generated in ${data.generationTime || '0'}s</span>
        <span><i class="fas fa-book"></i> ${wordCount} words</span>
    `;
}

// Load voices function
function loadVoices() {
    voices = speechSynthesis.getVoices();
    
    if (voiceSelect) {
        voiceSelect.innerHTML = '';
        voices.forEach((voice, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = voice.name;
            if (voice.name.toLowerCase().includes('female')) {
                option.selected = true;
                currentVoice = voice;
            }
            voiceSelect.appendChild(option);
        });
        
        if (!currentVoice && voices.length > 0) {
            currentVoice = voices[0];
        }
    }
}

// Start reading function
function startReading() {
    if (!storyContent || !storyContent.textContent.trim()) return;
    
    const utterance = new SpeechSynthesisUtterance(storyContent.textContent);
    
    if (currentVoice) {
        utterance.voice = currentVoice;
    }
    
    utterance.rate = speedSelect ? parseFloat(speedSelect.value) : 1;
    
    utterance.onstart = () => {
        isReading = true;
        if (readAloudButton) {
            readAloudButton.innerHTML = '<i class="fas fa-stop"></i> Stop Reading';
            readAloudButton.classList.add('reading');
        }
    };
    
    utterance.onend = () => {
        isReading = false;
        if (readAloudButton) {
            readAloudButton.innerHTML = '<i class="fas fa-play"></i> Read Aloud';
            readAloudButton.classList.remove('reading');
        }
    };
    
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
}

// Stop reading function
function stopReading() {
    speechSynthesis.cancel();
    isReading = false;
    if (readAloudButton) {
        readAloudButton.innerHTML = '<i class="fas fa-play"></i> Read Aloud';
        readAloudButton.classList.remove('reading');
    }
}

// Initialize voices
if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = loadVoices;
}

// Initial load of voices
loadVoices();

// Save story
function saveStory() {
    const story = {
        title: promptInput.value,
        genre: currentGenre,
        content: storyContent.textContent,
        timestamp: new Date().toISOString()
    };
    
    // Get existing stories
    const savedStories = JSON.parse(localStorage.getItem('savedStories') || '[]');
    savedStories.push(story);
    
    // Save to localStorage
    localStorage.setItem('savedStories', JSON.stringify(savedStories));
    
    // Show success message
    showSuccess('Story saved successfully!');
}

// Show error message
function showError(message) {
    if (!message || !errorText || !errorMessage) return;
    if (message.trim()) {
        errorText.textContent = message;
        errorMessage.classList.remove('hidden');
    }
}

// Show success message
function showSuccess(message) {
    const successMessage = document.createElement('div');
    successMessage.className = 'success-message';
    successMessage.innerHTML = `
        <div class="success-content">
            <i class="fas fa-check-circle"></i>
            <p>${message}</p>
        </div>
    `;
    
    document.querySelector('.main-content').prepend(successMessage);
    
    // Remove after 3 seconds
    setTimeout(() => {
        successMessage.remove();
    }, 3000);
}

// Dismiss error message
function dismissError() {
    errorMessage.classList.add('hidden');
}

// Initialize voices
async function initializeVoices() {
    return new Promise((resolve) => {
        const checkVoices = () => {
            const voices = speechSynthesis.getVoices();
            if (voices.length > 0) {
                resolve(voices);
            } else {
                setTimeout(checkVoices, 100);
            }
        };
        checkVoices();
    });
}

// Initialize the application
async function initialize() {
    try {
        // Hide error message on start
        if (errorMessage) {
            errorMessage.classList.add('hidden');
        }
        
        // Initialize voices
        await initializeVoices();
        loadVoices();
        
        // Add voices changed event listener
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = loadVoices;
        }
        
        console.log('Application initialized');
    } catch (error) {
        console.error('Error initializing voices:', error);
    }
}

// Start the application
initialize(); 