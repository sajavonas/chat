const socket = io();
function authenticate() {
    const password = document.getElementById('password').value;
    socket.emit('authenticate', password);
}
socket.on('auth success', (msgs) => {
    document.getElementById('auth').style.display = 'none';
    document.getElementById('chat').style.display = 'block';
    const popup = document.getElementById('popup');
    popup.style.display = 'flex';
    setTimeout(() => popup.style.display = 'none', 3000);
    document.getElementById('messages').innerHTML = '';
    msgs.forEach(message => {
        addMessage(message);
    });
});
socket.on('auth failure', () => alert('Неверный пароль'));
function sendMessage() {
    const input = document.getElementById('m');
    socket.emit('chat message', input.value);
    input.value = '';
}
socket.on('chat message', (message) => {
    addMessage(message);
});
function addMessage(message) {
    const item = document.createElement('li');
    item.textContent = `${message.text} (${message.timestamp})`;
    if (!message.deleted) {
        const delBtn = document.createElement('button');
        delBtn.textContent = 'Удалить';
        delBtn.onclick = () => socket.emit('delete message', message.id);
        item.appendChild(delBtn);
    }
    document.getElementById('messages').appendChild(item);
}

function addMessage(message) {
  const item = document.createElement('li');
  item.textContent = `${message.text} (${message.timestamp})`;
  item.dataset.id = String(message.id);

  if (!message.deleted) {
    const delBtn = document.createElement('button');
    delBtn.textContent = 'Удалить';
    delBtn.onclick = () => socket.emit('delete message', message.id);
    item.appendChild(delBtn);
  }

  document.getElementById('messages').appendChild(item);
}

socket.on('delete message', (id) => {
  const li = document.querySelector(`#messages li[data-id="${id}"]`);
  if (li) li.remove();
});
``

});
