
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

function saveMessages() {
    fs.writeFileSync(MESSAGE_FILE, JSON.stringify(messages));
}

let userCount = 0;

io.on('connection', (socket) => {
    userCount++;
    io.emit('user count', userCount);

    socket.on('disconnect', () => {
        userCount--;
        io.emit('user count', userCount);
    });

    socket.on('authenticate', (password) => {
        if (password === 'bulbul') {
            const cutoff = Date.now() - 24 * 60 * 60 * 1000;
            messages = messages.filter(m => m.id > cutoff);
            saveMessages();
            socket.emit('auth success', messages.filter(m => !m.deleted));
        } else if (password === 'kakutis') {
            socket.emit('auth success', messages);
        } else {
            socket.emit('auth failure');
        }
    });

    socket.on('chat message', (msg) => {
        const now = new Date();
        const timestamp = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
        const messageObj = { id: Date.now(), text: msg.text, image: msg.image || null, timestamp: timestamp, deleted: false };
        messages.push(messageObj);
        saveMessages();
        io.emit('chat message', messageObj);
    });

    socket.on('delete message', (id) => {
        messages = messages.map(m => m.id === id ? { ...m, deleted: true } : m);
        saveMessages();
        io.emit('delete message', id);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server running on port ${PORT}`));
