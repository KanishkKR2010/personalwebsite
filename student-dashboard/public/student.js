function ensureAuth() {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  if (!token || role !== 'student') {
    window.location.href = '/';
  }
  return token;
}

function logout() {
  localStorage.clear();
  window.location.href = '/';
}

async function load() {
  const token = ensureAuth();
  document.getElementById('welcome').textContent = localStorage.getItem('name');
  const res = await fetch('/api/dashboard/student', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    logout();
    return;
  }
  const data = await res.json();
  const list = document.getElementById('courses');
  list.innerHTML = '';
  data.courses.forEach(c => {
    const li = document.createElement('li');
    li.textContent = `${c.title} — ${c.description ?? ''}`;
    list.appendChild(li);
  });
}

document.getElementById('logout').addEventListener('click', logout);
load();

