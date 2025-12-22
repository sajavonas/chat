
// Initialize Supabase client
const supabase = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

const authSection = document.getElementById('auth-section');
const chatSection = document.getElementById('chat-section');
const userInfo = document.getElementById('user-info');

const signupBtn = document.getElementById('signup-btn');
const signinBtn = document.getElementById('signin-btn');
const signoutBtn = document.getElementById('signout-btn');

const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

const messagesEl = document.getElementById('messages');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');

let realtimeChannel = null;

function setUIForUser(user) {
  if (user) {
    authSection.classList.add('hidden');
    chatSection.classList.remove('hidden');
    userInfo.textContent = `Signed in as ${user.email}`;
  } else {
    authSection.classList.remove('hidden');
    chatSection.classList.add('hidden');
    userInfo.textContent = '';
  }
}

async function loadMessages() {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) {
    console.error('Error loading messages', error);
    return;
  }
  messagesEl.innerHTML = '';
  data.forEach(renderMessage);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function renderMessage(msg) {
  const li = document.createElement('li');
  const meta = document.createElement('div');
  meta.className = 'msg-meta';
  const when = new Date(msg.created_at).toLocaleString();
  meta.textContent = `User ${msg.user_id} • ${when}`;
  const body = document.createElement('div');
  body.textContent = msg.content;
  li.appendChild(meta);
  li.appendChild(body);
  messagesEl.appendChild(li);
}

async function sendMessage(text) {
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return alert('You must be signed in.');
  const { error } = await supabase
    .from('messages')
    .insert({ content: text, user_id: user.id });
  if (error) {
    console.error('Error sending message', error);
    alert(error.message);
  }
}

// Auth handlers
signupBtn.addEventListener('click', async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  if (!email || !password) return;
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) {
    alert(error.message);
  } else {
    alert('Sign-up successful! Check your email if confirmation is required.');
  }
});

signinBtn.addEventListener('click', async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    alert(error.message);
  }
});

signoutBtn.addEventListener('click', async () => {
  await supabase.auth.signOut();
});

messageForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = messageInput.value.trim();
  if (!text) return;
  await sendMessage(text);
  messageInput.value = '';
});

// Auth state
supabase.auth.onAuthStateChange((event, session) => {
  const user = session?.user || null;
  setUIForUser(user);
  if (user) {
    loadMessages();
    startRealtime();
  } else {
    stopRealtime();
    messagesEl.innerHTML = '';
  }
});

function startRealtime() {
  stopRealtime();
  realtimeChannel = supabase.channel('realtime:messages')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
    }, (payload) => {
      renderMessage(payload.new);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    })
    .subscribe((status) => {
      console.log('Realtime status:', status);
    });
}

function stopRealtime() {
  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }
}

// Initial load: reflect current auth session
(async () => {
  const { data: { session } } = await supabase.auth.getSession();
  setUIForUser(session?.user || null);
  if (session?.user) {
    await loadMessages();
    startRealtime();
  }
})();
