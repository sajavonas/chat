
const express = require('express');
const fs = require('fs');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

const MESSAGE_FILE = 'messages.json';
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
messages = messages.filter(m => new Date(m.id).getTime() > cutoff);

function saveMessages() {
    fs.writeFileSync(MESSAGE_FILE, JSON.stringify(messages));
}

io.on('connection', (socket) => {
    socket.emit('load messages', messages);

    socket.on('authenticate', (password) => {
        if (password === 'bulbul') {
            socket.emit('auth success');
        } else {
            socket.emit('auth failure');
        }
    });

    socket.on('chat message', (msg) => {
        const now = new Date();
        const timestamp = `${now.getMonth()+1}/${now.getDate()} ${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
        const messageObj = { id: Date.now(), text: msg, timestamp: timestamp };
        messages.push(messageObj);

        // Remove old messages
        const cutoff = Date.now() - 24 * 60 * 60 * 1000;
        messages = messages.filter(m => new Date(m.id).getTime() > cutoff);

        saveMessages();
        io.emit('chat message', messageObj);
    });

    socket.on('delete message', (id) => {
        messages = messages.filter(m => m.id !== id);
        saveMessages();
        io.emit('delete message', id);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server running on port ${PORT}`));
