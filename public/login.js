document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const password = document.getElementById('password').value;
    if(password === 'secret123') {
        window.location.href = '/chat.html';
    } else {
        document.getElementById('error').innerText = 'Incorrect password!';
    }
});