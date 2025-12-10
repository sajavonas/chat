const socket = io();

function authenticate() {
    const password = document.getElementById('password').value;
    socket.emit('authenticate', password);
}

socket.on('auth success', (msg) => {
    alert(msg);
    document.getElementById('auth').style.display = 'none';
    document.getElementById('chat').style.display = 'block';
});

socket.on('auth failure', () => {
    alert('Wrong password');
});

function sendMessage() {
    const input = document.getElementById('m');
    socket.emit('chat message', input.value);
    input.value = '';
}

socket.on('chat message', (message) => {
    const item = document.createElement('li');
    item.textContent = message.text + ' (' + message.time + ')';
    document.getElementById('messages').appendChild(item);
});

socket.on('load messages', (msgs) => {
    msgs.forEach(message => {
        const item = document.createElement('li');
        item.textContent = message.text + ' (' + message.time + ')';
        document.getElementById('messages').appendChild(item);
    });
});
