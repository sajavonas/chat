
const supabase = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

const loginSection = document.getElementById('login-section');
const greetingSection = document.getElementById('greeting-section');
const chatSection = document.getElementById('chat-section');
const passwordInput = document.getElementById('password-input');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const messageInput = document.getElementById('message-input');
const imageInput = document.getElementById('image-input');
const sendBtn = document.getElementById('send-btn');
const messagesEl = document.getElementById('messages');

const PASSWORD = 'bulbul'; // local password

loginBtn.addEventListener('click', () => {
  const val = passwordInput.value.trim();
  if (val === PASSWORD) {
    loginSection.classList.add('hidden');
    greetingSection.classList.remove('hidden');
    chatSection.classList.remove('hidden');
    loadMessages();
    startRealtime();
  } else {
    alert('Wrong password');
  }
});

logoutBtn.addEventListener('click', () => {
  greetingSection.classList.add('hidden');
  chatSection.classList.add('hidden');
  loginSection.classList.remove('hidden');
  messagesEl.innerHTML = '';
});

async function loadMessages() {
  const { data, error } = await supabase.from('messages').select('*').order('created_at', { ascending: true });
  if (error) { console.error(error); return; }
  messagesEl.innerHTML = '';
  data.forEach(renderMessage);
}

function renderMessage(msg) {
  const li = document.createElement('li');
  const meta = document.createElement('div');
  meta.className = 'meta';
  meta.textContent = new Date(msg.created_at).toLocaleString();
  const body = document.createElement('div');
  body.textContent = msg.content || '';
  li.appendChild(meta);
  li.appendChild(body);
  if (msg.image_url) {
    const img = document.createElement('img');
    img.src = msg.image_url;
    li.appendChild(img);
  }
  const actions = document.createElement('div');
  actions.className = 'actions';
  const delBtn = document.createElement('button');
  delBtn.className = 'danger';
  delBtn.textContent = 'Delete';
  delBtn.onclick = () => deleteMessage(msg.id);
  actions.appendChild(delBtn);
  li.appendChild(actions);
  messagesEl.appendChild(li);
}

async function deleteMessage(id) {
  const { error } = await supabase.from('messages').delete().eq('id', id);
  if (error) alert(error.message);
}

sendBtn.addEventListener('click', async () => {
  const text = messageInput.value.trim();
  const file = imageInput.files[0];
  let imageUrl = null;
  if (file) {
    const path = `${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from('chat-media').upload(path, file);
    if (uploadError) { alert(uploadError.message); return; }
    const { data: pub } = supabase.storage.from('chat-media').getPublicUrl(path);
    imageUrl = pub.publicUrl;
  }
  if (!text && !imageUrl) return;
  const { error } = await supabase.from('messages').insert({ content: text, image_url: imageUrl });
  if (error) alert(error.message);
  messageInput.value = '';
  imageInput.value = '';
});

function startRealtime() {
  supabase.channel('realtime:messages')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
      renderMessage(payload.new);
    })
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' }, () => {
      loadMessages();
    })
    .subscribe();
}
