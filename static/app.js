// Game state variables
let ws = null;
let gameId = null;
let isConnected = false;

// Character emoji mapping
const characterEmojis = {
    "Tharin": "⚔️",
    "Lyra": "🔮", 
    "Finn": "🗡️"
};

function updateStatus(message, connected = false) {
    const status = document.getElementById('status');
    status.textContent = message;
    status.className = `status ${connected ? 'connected' : 'disconnected'}`;
    isConnected = connected;
}

function startGame() {
    const gmPrompt = document.getElementById('gmPrompt').value.trim();
    if (!gmPrompt) {
        alert('Please enter a scenario to start the adventure!');
        return;
    }

    const startBtn = document.getElementById('startBtn');
    startBtn.disabled = true;
    startBtn.innerHTML = 'Starting...';

    fetch('/api/game/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            gmPrompt,
            characters: [
                { name: "Tharin", emoji: "⚔️", class: "Fighter", personality: "Brave and loyal, always ready to protect allies" },
                { name: "Lyra", emoji: "🔮", class: "Wizard", personality: "Curious and analytical, loves solving puzzles" },
                { name: "Finn", emoji: "🗡️", class: "Rogue", personality: "Witty and sneaky, prefers clever solutions" }
            ]
        })
    })
        .then(r => r.json())
        .then(data => {
            gameId = data.gameId;

            // Hide the scenario section and show the chat container
            document.getElementById('scenarioSection').style.display = 'none';
            document.getElementById('chatContainer').style.display = 'block';

            connectWebSocket();
            addMessage('🎲 Game Master', gmPrompt, 'gm');
            updateStatus('🟢 Game started! Characters are responding...', true);

            // Fetch and display character introductions
            fetchCharacterIntroductions();

            // Enable GM input
            document.getElementById('messageInput').disabled = false;
            document.getElementById('sendBtn').disabled = false;
            document.getElementById('messageInput').focus();
        })
        .catch(error => {
            console.error('Error starting game:', error);
            updateStatus('❌ Failed to start game', false);
            startBtn.disabled = false;
            startBtn.innerHTML = 'Start your adventure!';
        });
}

function fetchCharacterIntroductions() {
    if (!gameId) return;

    fetch(`/api/game/status?gameId=${gameId}`)
        .then(r => r.json())
        .then(gameState => {
            // Display all character messages (introductions) with a slight delay for better UX
            const characterMessages = gameState.messages.filter(msg => msg.type === 'character');
            
            characterMessages.forEach((msg, index) => {
                setTimeout(() => {
                    addMessage(msg.speaker, msg.message, 'character');
                }, (index + 1) * 1000); // 1 second delay between each introduction
            });

            if (characterMessages.length > 0) {
                setTimeout(() => {
                    updateStatus('🟢 Characters have introduced themselves! Continue the adventure...', true);
                }, characterMessages.length * 1000 + 500);
            }
        })
        .catch(error => {
            console.error('Error fetching character introductions:', error);
        });
}

function connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

    ws.onopen = () => {
        updateStatus('🟢 Connected and ready!', true);
    };

    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            if (data.type === 'character_response') {
                addMessage(data.speaker, data.message, 'character');
            }
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    };

    ws.onclose = () => {
        updateStatus('🔴 Connection lost', false);
        setTimeout(() => {
            if (gameId) connectWebSocket();
        }, 3000);
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        updateStatus('❌ Connection error', false);
    };
}

function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();

    if (!message || !ws || !gameId) return;

    const sendBtn = document.getElementById('sendBtn');
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<span>📡 Sending...</span>';

    try {
        ws.send(JSON.stringify({
            type: 'gm_prompt',
            gameId,
            message
        }));

        addMessage('🎲 Game Master', message, 'gm');
        input.value = '';
        updateStatus('🟢 Characters are responding...', true);

        setTimeout(() => {
            sendBtn.disabled = false;
            sendBtn.innerHTML = '<span>Send</span>';
        }, 2000);

    } catch (error) {
        console.error('Error sending message:', error);
        updateStatus('❌ Failed to send message', false);
        sendBtn.disabled = false;
        sendBtn.innerHTML = '<span>Send</span>';
    }
}

function colourFromName(name) {
    // Generate a color based on the character name
    const hash = Array.from(name).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 30%)`;
}

function addMessage(speaker, message, type) {
    const chatArea = document.getElementById('chatArea');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    
    // For character messages, add emoji if available
    let displaySpeaker = speaker;
    if (type === 'character') {
        // Extract character name (remove any existing prefixes)
        const cleanName = speaker.replace(/^🎭\s*/, '').trim();
        const emoji = characterEmojis[cleanName];
        if (emoji) {
            displaySpeaker = `${emoji} ${cleanName}`;
        }
    }
    
    messageDiv.innerHTML = `<strong>${displaySpeaker}</strong>${message}`;
    messageDiv.style.backgroundColor = colourFromName(speaker);
    chatArea.appendChild(messageDiv);
    chatArea.scrollTop = chatArea.scrollHeight;
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Enter key handling
    document.getElementById('messageInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    document.getElementById('gmPrompt').addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            e.preventDefault();
            startGame();
        }
    });

    // Auto-focus on the scenario input
    document.getElementById('gmPrompt').focus();
});
