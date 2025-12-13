
const express = require('express');
const fs = require('fs');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

const MESSAGE_FILE = 'messages.json';
const BACKUP_FILE = 'messages_backup.json';
let messages = [];

// Load messages from file or restore from backup if empty or corrupted
function loadMessages() {
    if (fs.existsSync(MESSAGE_FILE)) {
        try {
            const data = fs.readFileSync(MESSAGE_FILE);
            messages = data.length ? JSON.parse(data) : restoreFromBackup();
        } catch (err) {
            console.error('Error reading messages.json, restoring from backup');
            messages = restoreFromBackup();
        }
    } else {
        messages = restoreFromBackup();
    }
}

function restoreFromBackup() {
    if (fs.existsSync(BACKUP_FILE)) {
        try {
            const backupData = fs.readFileSync(BACKUP_FILE);
            return backupData.length ? JSON.parse(backupData) : [];
        } catch (err) {
            return [];
        }
    }
    return [];
}

function saveMessages() {
    fs.writeFileSync(MESSAGE_FILE, JSON.stringify(messages));
    fs.writeFileSync(BACKUP_FILE, JSON.stringify(messages)); // Always update backup
}

loadMessages();

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
            const filtered = messages.filter(m => m.id > cutoff && !m.deleted);
            socket.emit('auth success', filtered);
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
