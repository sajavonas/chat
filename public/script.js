const socket = io();
let authenticated = false;
function authenticate() {
    const password = document.getElementById('password').value;
    socket.emit('authenticate', password);
}
socket.on('auth success', (msgs) => {
    authenticated = true;
    document.getElementById('auth').style.display = 'none';
    document.getElementById('chat').style.display = 'block';
    const popup = document.getElementById('popup');
    popup.style.display = 'flex';
    setTimeout(() => popup.style.display = 'none', 3000);
    document.getElementById('messages').innerHTML = '';
    msgs.forEach(message => addMessage(message));
});
socket.on('auth failure', () => alert('Неверный пароль'));
function sendMessage() {
    if (!authenticated) {
        alert('Введите пароль снова');
        return;
    }
    const input = document.getElementById('m');
    const fileInput = document.getElementById('imageInput');
    let imageData = null;
    if (fileInput.files.length > 0) {
        const reader = new FileReader();
        reader.onload = function(e) {
            imageData = e.target.result;
            socket.emit('chat message', { text: input.value, image: imageData });
        };
        reader.readAsDataURL(fileInput.files[0]);
    } else {
        socket.emit('chat message', { text: input.value });
    }
    input.value = '';
    fileInput.value = '';
}
socket.on('chat message', (message) => addMessage(message));
function addMessage(message) {
    const item = document.createElement('li');
    item.textContent = `${message.text} (${message.timestamp})`;
    if (message.image) {
        const img = document.createElement('img');
        img.src = message.image;
        img.className = 'chat-image';
        item.appendChild(img);
    }
    if (!message.deleted) {
        const delBtn = document.createElement('button');
        delBtn.textContent = 'Удалить';
        delBtn.onclick = () => socket.emit('delete message', message.id);
        item.appendChild(delBtn);
    }
    document.getElementById('messages').appendChild(item);
}
socket.on('delete message', (id) => {
    const items = document.querySelectorAll('#messages li');
    items.forEach(item => {
        if (item.textContent.includes(id)) {
            item.remove();
        }
    });
});
socket.on('user count', (count) => {
    document.getElementById('userCount').textContent = `Пользователей онлайн: ${count}`;
});
setInterval(() => {
    authenticated = false;
    alert('Введите пароль снова');
    document.getElementById('auth').style.display = 'block';
    document.getElementById('chat').style.display = 'none';
}, 180000);
