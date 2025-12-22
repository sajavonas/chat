
// Initialize Supabase client
const supabase = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

// Elements
const gate = document.getElementById('gate');
const gateForm = document.getElementById('gate-form');
const gateInput = document.getElementById('gate-input');

const chat = document.getElementById('chat');
const roleIndicator = document.getElementById('role-indicator');
const messagesEl = document.getElementById('messages');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const imageInput = document.getElementById('image-input');
const logoffBtn = document.getElementById('logoff-btn');

const ROLE_USER = 'user';
const ROLE_ADMIN = 'admin';

let role = null; // 'user' or 'admin'
let realtimeChannel = null;

// --- Password gate ---
function setRole(newRole) {
  role = newRole;
  localStorage.setItem('chat_role', role);
  roleIndicator.textContent = role === ROLE_ADMIN ? 'Admin (kakutis)' : 'User (bulbul)';
  gate.classList.add('hidden');
  chat.classList.remove('hidden');
  loadMessages();
  startRealtime();
}

gateForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const val = gateInput.value.trim();
  if (!val) return;
  if (val === 'bulbul') setRole(ROLE_USER);
  else if (val === 'kakutis') setRole(ROLE_ADMIN);
  else alert('Incorrect password');
  gateInput.value = '';
});

logoffBtn?.addEventListener('click', () => {
  localStorage.removeItem('chat_role');
  role = null;
  stopRealtime();
  messagesEl.innerHTML = '';
  chat.classList.add('hidden');
  gate.classList.remove('hidden');
  roleIndicator.textContent = '';
});

// Restore role if present
(function init() {
  const stored = localStorage.getItem('chat_role');
  if (stored === ROLE_USER || stored === ROLE_ADMIN) {
    setRole(stored);
  }
})();

// --- Load & render ---
async function loadMessages() {
  const query = supabase.from('messages').select('*').order('created_at', { ascending: true });
  if (role !== ROLE_ADMIN) query.is('deleted_at', null);
  const { data, error } = await query;
  if (error) { console.error('Error loading messages', error); return; }
  messagesEl.innerHTML = '';
  data.forEach(renderMessage);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function fmt(ts) {
  const d = new Date(ts);
  const day = d.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
  const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  return `${day} • ${time}`;
}

function renderMessage(msg) {
  const li = document.createElement('li');
  const meta = document.createElement('div');
  meta.className = 'msg-meta';
  meta.textContent = fmt(msg.created_at);

  const body = document.createElement('div');
  if (msg.content) body.textContent = msg.content;
  if (msg.image_url) {
    const img = document.createElement('img');
    img.src = msg.image_url; img.alt = 'image'; img.className = 'chat-image';
    body.appendChild(img);
  }

  li.appendChild(meta);
  li.appendChild(body);

  if (role === ROLE_ADMIN && msg.deleted_at) {
    const del = document.createElement('span');
    del.className = 'msg-deleted';
    del.textContent = `(deleted at ${fmt(msg.deleted_at)})`;
    meta.appendChild(del);
  }

  const actions = document.createElement('div');
  actions.className = 'msg-actions';
  const delBtn = document.createElement('button');
  delBtn.className = 'btn-small danger';
  delBtn.textContent = 'Delete';
  delBtn.addEventListener('click', () => softDeleteMessage(msg.id));
  actions.appendChild(delBtn);
  li.appendChild(actions);

  messagesEl.appendChild(li);
}

async function softDeleteMessage(id) {
  const { error } = await supabase.from('messages').update({ deleted_at: new Date().toISOString() }).eq('id', id);
  if (error) { console.error('Delete failed', error); alert(error.message); }
}

// --- Send message or image ---
messageForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = messageInput.value.trim();
  const file = imageInput.files && imageInput.files[0] ? imageInput.files[0] : null;

  let imageUrl = null;
  if (file) {
    const ext = (file.name.split('.').pop() || 'png').toLowerCase();
    const uuid = (crypto && crypto.randomUUID) ? crypto.randomUUID() : (Date.now()+"-"+Math.random().toString(16).slice(2));
    const path = `${new Date().toISOString().slice(0,10)}/${uuid}.${ext}`;
    const { error: upErr } = await supabase.storage.from('chat-media').upload(path, file, { upsert: false });
    if (upErr) { alert(upErr.message); return; }
    const { data: pub } = supabase.storage.from('chat-media').getPublicUrl(path);
    imageUrl = pub.publicUrl;
  }

  if (!text && !imageUrl) return; // require something

  const { error } = await supabase.from('messages').insert({
    content: text || null,
    image_url: imageUrl || null,
    role: role,
  });
  if (error) { console.error('Send failed', error); alert(error.message); return; }
  messageInput.value = '';
  imageInput.value = '';
});

// --- Realtime ---
function startRealtime() {
  stopRealtime();
  realtimeChannel = supabase.channel('realtime:messages')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
      const msg = payload.new;
      if (role !== ROLE_ADMIN && msg.deleted_at) return;
      renderMessage(msg);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, () => {
      loadMessages(); // re-render on delete (soft)
    })
    .subscribe((status) => console.log('Realtime status:', status));
}

function stopRealtime() {
  if (realtimeChannel) { supabase.removeChannel(realtimeChannel); realtimeChannel = null; }
}
