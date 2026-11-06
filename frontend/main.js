const output = document.getElementById('output');
const statusElement = document.getElementById('status');
const result = document.getElementById('result');

// inputs
const idInput = document.getElementById('userId');
const usernameInput = document.getElementById('username');
const descriptionInput = document.getElementById('description');

// buttons
const btnGetAll = document.getElementById('btn-get-all');
const btnGetDetail = document.getElementById('btn-get-one');
const btnPost = document.getElementById('btn-post');
const btnPut = document.getElementById('btn-put');
const btnPatch = document.getElementById('btn-patch');
const btnDelete = document.getElementById('btn-delete');

const usersBody = document.getElementById('usersBody');
const filtersBox = document.getElementById('filters');

const BASE_API = 'http://localhost:3000/users';

const historyList = document.querySelector('.history-list');
const clearBtn = document.querySelector('.clear');
const HISTORY_KEY = 'requestHistory';

let log = [];
try { log = JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; } catch (e) {}

let allUsers = [];
let currentFilter = 'Все';
let selectedId = null;

const trimmed = (element) => {
  return element.value.trim();
};


const renderFilters = () => {
  const unique = ['Все', ...new Set(allUsers.map(u => u.description))];
  if (!unique.includes(currentFilter)) currentFilter = 'Все';

  filtersBox.innerHTML = '';
  unique.forEach(value => {
    const btn = document.createElement('button');
    btn.textContent = value;
    btn.className = value === currentFilter ? 'active' : '';
    btn.onclick = () => {
      currentFilter = value;
      renderFilters();
      renderTable();
    };
    filtersBox.appendChild(btn);
  });
};

const renderTable = () => {
  const list = currentFilter === 'Все'
      ? allUsers
      : allUsers.filter(u => u.description === currentFilter);

  usersBody.innerHTML = '';

  if (!list.length) {
    usersBody.innerHTML = '<tr class="empty-row"><td colspan="3">Пользователей нет</td></tr>';
    return;
  }

  list.forEach(user => {
    const tr = document.createElement('tr');
    if (user.id === selectedId) tr.className = 'selected';

    [user.id, user.username, user.description].forEach(value => {
      const td = document.createElement('td');
      td.textContent = value;
      tr.appendChild(td);
    });

    tr.onclick = () => {
      selectedId = user.id;
      idInput.value = user.id;
      usernameInput.value = user.username;
      descriptionInput.value = user.description;
      renderTable();
    };

    usersBody.appendChild(tr);
  });
};

const setUsers = (users) => {
  allUsers = users;
  renderFilters();
  renderTable();
};

const loadUsers = async () => {
  try {
    const response = await fetch(BASE_API);
    const data = await response.json();
    if (Array.isArray(data)) setUsers(data);
  } catch (e) {}
};


const showResult = (status, data) => {
  output.style.display = 'block';
  statusElement.textContent = `Статус: ${status ? status : 'Error'}`;
  result.textContent = JSON.stringify(data, null, 2);
};

const requester = async (method, id, payload) => {
  const url = `${BASE_API}${id ? `/${encodeURIComponent(id)}` : ''}`;
  try {
    const settingsFetch = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (payload) settingsFetch.body = JSON.stringify(payload);

    const response = await fetch(url, settingsFetch);
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    addHistory(method, url, response.status);
    showResult(response.status, data);

    if (method === 'GET' && !id && Array.isArray(data)) {
      setUsers(data);
    } else if (method !== 'GET' && response.ok) {
      loadUsers();
    }
  } catch (error) {
    addHistory(method, url, 'Ошибка сети');
    showResult('Сервер недоступен', error.message);
  }
};

const getAll = () => {
  requester('GET');
};

const getOne = () => {
  if (!trimmed(idInput)) {
    alert('Укажите id');
    return;
  }
  requester('GET', trimmed(idInput));
};

const create = () => {
  if (!trimmed(usernameInput) || !trimmed(descriptionInput)) {
    alert('Укажите username и description');
    return;
  }

  requester('POST', '', {
    username: trimmed(usernameInput),
    description: trimmed(descriptionInput)
  });
};

const put = () => {
  if (!trimmed(usernameInput) || !trimmed(descriptionInput) || !trimmed(idInput)) {
    alert('Укажите id, username и description');
    return;
  }
  requester('PUT', trimmed(idInput), {
    username: trimmed(usernameInput),
    description: trimmed(descriptionInput)
  });
};

const patch = () => {
  const payload = {};
  if (!trimmed(idInput)) {
    alert('Укажите id');
    return;
  }
  if (!trimmed(usernameInput) && !trimmed(descriptionInput)) {
    alert('Укажите username или description');
    return;
  }

  if (trimmed(usernameInput)) payload.username = trimmed(usernameInput);
  if (trimmed(descriptionInput)) payload.description = trimmed(descriptionInput);

  requester('PATCH', trimmed(idInput), payload);
};

const deleteUser = () => {
  if (!trimmed(idInput)) {
    alert('Укажите id');
    return;
  }
  requester('DELETE', trimmed(idInput));
};


const timeAgo = (ts) => {
  const sec = Math.floor((Date.now() - ts) / 1000);
  if (sec < 5) return 'только что';
  if (sec < 60) return `${sec} сек назад`;

  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} мин назад`;

  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours} ч назад`;

  return `${Math.floor(hours / 24)} дн назад`;
};

const renderHistory = () => {
  historyList.innerHTML = '';
  log.forEach(({ method, address, status, ts }) => {
    const row = document.createElement('div');
    row.className = 'history-item';
    row.innerHTML = `
      <span class="method">${method}</span>
      <span class="adress">${address}</span>
      <span class="status">${status}</span>
      <span class="time">
        ${new Date(ts).toLocaleTimeString()}
        <small class="ago" data-ts="${ts}">(${timeAgo(ts)})</small>
      </span>
    `;
    historyList.prepend(row);
  });
};

const addHistory = (method, address, status) => {
  log.push({ method, address, status, ts: Date.now() });
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(log)); } catch (e) {}
  renderHistory();
};

clearBtn.onclick = () => {
  log = [];
  try { localStorage.removeItem(HISTORY_KEY); } catch (e) {}
  renderHistory();
};

renderHistory();

setInterval(() => {
  document.querySelectorAll('.ago').forEach(el => {
    el.textContent = `(${timeAgo(Number(el.dataset.ts))})`;
  });
}, 10000);


btnGetAll.onclick = getAll;
btnGetDetail.onclick = getOne;
btnPost.onclick = create;
btnPut.onclick = put;
btnPatch.onclick = patch;
btnDelete.onclick = deleteUser;

loadUsers();