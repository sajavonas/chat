const socket = io();
function authenticate() {
    const password = document.getElementById('password').value;
    socket.emit('authenticate', password);
}
socket.on('auth success', () => {
    document.getElementById('auth').style.display = 'none';
    document.getElementById('chat').style.display = 'block';
    const popup = document.getElementById('popup');
    popup.style.display = 'flex';
    setTimeout(() => popup.style.display = 'none', 3000);
});
socket.on('auth failure', () => alert('Wrong password'));
function sendMessage() {
    const input = document.getElementById('m');
    socket.emit('chat message', input.value);
    input.value = '';
}
socket.on('chat message', (message) => {
    const item = document.createElement('li');
    item.textContent = `${message.text} (${message.timestamp})`;
    const delBtn = document.createElement('button');
    delBtn.textContent = 'Delete';
    delBtn.onclick = () => socket.emit('delete message', message.id);
    item.appendChild(delBtn);
    document.getElementById('messages').appendChild(item);
});
socket.on('load messages', (msgs) => {
    msgs.forEach(message => {
        const item = document.createElement('li');
        item.textContent = `${message.text} (${message.timestamp})`;
        const delBtn = document.createElement('button');
        delBtn.textContent = 'Delete';
        delBtn.onclick = () => socket.emit('delete message', message.id);
        item.appendChild(delBtn);
        document.getElementById('messages').appendChild(item);
    });
});
socket.on('delete message', (id) => {
    const items = document.querySelectorAll('#messages li');
    items.forEach(item => {
        if (item.textContent.includes(id)) {
            item.remove();
        }
    });
});
