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

let currentGenre = 'story';
let isReading = false;
let currentVoice = null;
let voices = [];

const speechSynthesis = window.speechSynthesis;

storyForm.addEventListener('submit', handleSubmit);
genreButtons.forEach(button => {
    button.addEventListener('click', () => handleGenreChange(button));
});

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

if (speedSelect) {
    speedSelect.addEventListener('change', () => {
        if (isReading) {
            stopReading();
            startReading();
        }
    });
}

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

async function handleSubmit(e) {
    e.preventDefault();
    
    const prompt = promptInput.value.trim();
    if (!prompt) return;

    if (errorMessage) {
        errorMessage.classList.add('hidden');
    }

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
    
    if (!success) {
        showError('Unable to connect to the server. Please try again.');
    }
}

function handleGenreChange(button) {
    genreButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    currentGenre = button.dataset.genre;
}

function formatStoryContent(content) {
    if (!content) return '<p>No content generated</p>';
    const paragraphs = content.split('\n\n');
    return paragraphs
        .map(para => `<p>${para.trim()}</p>`)
        .join('');
}

function formatNurseryRhymeContent(content) {
    if (!content) return '<p>No content generated</p>';
    const lines = content.split('\n');
    return lines
        .map(line => `<p class="nursery-rhyme-line">${line.trim()}</p>`)
        .join('');
}

function formatPoemContent(content) {
    if (!content) return '<p>No content generated</p>';
    const lines = content.split('\n');
    return lines
        .map(line => `<p class="poem-line">${line.trim()}</p>`)
        .join('');
}

function updateStoryMeta(data) {
    const metaContainer = document.querySelector('.story-meta');
    const wordCount = data.content.split(/\s+/).length;
    
    metaContainer.innerHTML = `
        <span><i class="fas fa-clock"></i> Generated in ${data.generationTime || '0'}s</span>
        <span><i class="fas fa-book"></i> ${wordCount} words</span>
    `;
}

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

function stopReading() {
    speechSynthesis.cancel();
    isReading = false;
    if (readAloudButton) {
        readAloudButton.innerHTML = '<i class="fas fa-play"></i> Read Aloud';
        readAloudButton.classList.remove('reading');
    }
}

if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = loadVoices;
}

loadVoices();

function saveStory() {
    const story = {
        title: promptInput.value,
        genre: currentGenre,
        content: storyContent.textContent,
        timestamp: new Date().toISOString()
    };
    
    const savedStories = JSON.parse(localStorage.getItem('savedStories') || '[]');
    savedStories.push(story);
    
    localStorage.setItem('savedStories', JSON.stringify(savedStories));
    
    showSuccess('Story saved successfully!');
}

function showError(message) {
    if (!message || !errorText || !errorMessage) return;
    if (message.trim()) {
        errorText.textContent = message;
        errorMessage.classList.remove('hidden');
    }
}

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
    
    setTimeout(() => {
        successMessage.remove();
    }, 3000);
}

function dismissError() {
    errorMessage.classList.add('hidden');
}

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

async function initialize() {
    try {
        if (errorMessage) {
            errorMessage.classList.add('hidden');
        }
        
        await initializeVoices();
        loadVoices();
        
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = loadVoices;
        }
        
        console.log('Application initialized');
    } catch (error) {
        console.error('Error initializing voices:', error);
    }
}

initialize(); 
