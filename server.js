
const express = require('express');
const fs = require('fs');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

const MESSAGE_FILE = 'messages.json';

// Load messages from file
let messages = [];
if (fs.existsSync(MESSAGE_FILE)) {
    try {
        messages = JSON.parse(fs.readFileSync(MESSAGE_FILE));
    } catch (err) {
        messages = [];
    }
}

// Remove old messages (older than 24 hours)
const cutoff = Date.now() - 24 * 60 * 60 * 1000;
messages = messages.filter(m => new Date(m.time).getTime() > cutoff);

function saveMessages() {
    fs.writeFileSync(MESSAGE_FILE, JSON.stringify(messages));
}

io.on('connection', (socket) => {
    console.log('A user connected');

    // Send existing messages to new user
    socket.emit('load messages', messages);

    socket.on('authenticate', (password) => {
        if (password === 'bulbul') {
            socket.emit('auth success', 'Лабас Катерина');
        } else {
            socket.emit('auth failure');
        }
    });

    socket.on('chat message', (msg) => {
        const timestamp = new Date().toLocaleString();
        const messageObj = { text: msg, time: timestamp };
        messages.push(messageObj);

        // Remove messages older than 24 hours
        const cutoff = Date.now() - 24 * 60 * 60 * 1000;
        messages = messages.filter(m => new Date(m.time).getTime() > cutoff);

        saveMessages();
        io.emit('chat message', messageObj);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server running on port ${PORT}`));
