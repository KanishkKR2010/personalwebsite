function ensureAuth() {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  if (!token || role !== 'admin') {
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
  const res = await fetch('/api/dashboard/admin', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    logout();
    return;
  }
  const data = await res.json();
  const list = document.getElementById('summary');
  list.innerHTML = '';
  data.summary.forEach(r => {
    const li = document.createElement('li');
    li.textContent = `${r.role}: ${r.count}`;
    list.appendChild(li);
  });
}

document.getElementById('logout').addEventListener('click', logout);
load();