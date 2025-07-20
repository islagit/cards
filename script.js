const API = 'https://cards-backend-h3j6.onrender.com/api';

let data = { sections: [] };
let currentEditTarget = null;

// Загрузка секций при старте
async function render() {
  await loadFromBackend();
  generateFromData();
}

// Получить данные с сервера
async function loadFromBackend() {
  const res = await fetch(`${API}/sections`);
  data.sections = await res.json();
}

// Сохранить открытые accordion
function saveOpenState() {
  const openIds = Array.from(document.querySelectorAll('.accordion-content.active'))
    .map(el => el.id);
  sessionStorage.open = JSON.stringify(openIds);
}

// Восстановить accordion
function restoreOpenState() {
  if (!sessionStorage.open) return;
  JSON.parse(sessionStorage.open).forEach(id => {
    const content = document.getElementById(id);
    if (content) {
      content.classList.add('active');
      content.previousElementSibling.classList.add('active');
      const icon = content.previousElementSibling.querySelector('.toggle-icon');
      if (icon) icon.textContent = '−';
    }
  });
}

function parsePrefix(prefix) {
  const m = prefix.match(/^sec-(\d+)(?:-sub-(\d+)(?:-item-(\d+))?)?$/);
  return m ? { si: +m[1], sj: m[2] != null ? +m[2] : null, sk: m[3] != null ? +m[3] : null } : {};
}

// Создание кнопок CRUD
function createCrudButtons(prefix, level) {
  const addLabel = level === 1
    ? "Добавить подраздел"
    : level === 2 ? "Добавить элемент" : "Добавить элемент";
  return `
    <button class="crud-btn add" onclick="onAdd('${prefix}')" title="${addLabel}">＋</button>
    <button class="crud-btn edit" onclick="onEdit('${prefix}')" title="Редактировать">✏️</button>
    <button class="crud-btn delete" onclick="onDelete('${prefix}')" title="Удалить">🗑️</button>
  `;
}

function createAccordionItem(title, content, inner, level, id, prefix) {
  const isOpen = document.getElementById(id)?.classList.contains('active');
  return `
    <div class="accordion-item level-${level}">
      <div class="accordion-toggle ${isOpen ? 'active' : ''}" onclick="toggleAccordion('${id}')">
        <div class="toggle-left"><div class="toggle-title">${title}</div></div>
        <div class="toggle-right">
          ${createCrudButtons(prefix, level)}
          <div class="toggle-icon">${isOpen ? '−' : '+'}</div>
        </div>
      </div>
      <div class="accordion-content ${isOpen ? 'active' : ''}" id="${id}">
        ${content ? `<div class="content-text">${content}</div>` : ''}
        ${inner}
      </div>
    </div>`;
}

function generateFromData() {
  const container = document.getElementById('accordion-container');
  let html = '';

  data.sections.forEach((sec, i) => {
    const secId = `sec-${i}`, secPref = secId;
    let inner = '';

    sec.subsections?.forEach((sub, j) => {
      const subId = `${secPref}-sub-${j}`, subPref = subId;
      let subInner = '';

      sub.items?.forEach((it, k) => {
        const itmId = `${subPref}-item-${k}`, itmPref = itmId;
        subInner += createAccordionItem(
          `Элемент ${k + 1}: ${it.title}`,
          it.content,
          '',
          3,
          itmId,
          itmPref
        );
      });

      inner += createAccordionItem(
        sub.title,
        sub.content,
        subInner,
        2,
        subId,
        subPref
      );
    });

    html += createAccordionItem(
      sec.title,
      sec.content,
      inner,
      1,
      secId,
      secPref
    );
  });

  container.innerHTML = html;
  restoreOpenState();
}

// Переключение accordion
function toggleAccordion(id) {
  const c = document.getElementById(id);
  const t = c.previousElementSibling;
  const ic = t.querySelector('.toggle-icon');
  c.classList.toggle('active');
  t.classList.toggle('active');
  if (ic) ic.textContent = c.classList.contains('active') ? '−' : '+';
  saveOpenState();
}

// CREATE / UPDATE / DELETE

function onAdd(prefix) {
  const { si, sj, sk } = parsePrefix(prefix);
  showEditModal(
    sj === null ? "Добавить подраздел" : "Добавить элемент",
    '',
    '',
    async (title, content) => {
      if (sj === null) {
        await fetch(`${API}/subsections`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ section_id: data.sections[si].id, title, content })
        });
      } else {
        await fetch(`${API}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subsection_id: data.sections[si].subsections[sj].id, title, content })
        });
      }
      await render();
    }
  );
}

function onEdit(prefix) {
  const { si, sj, sk } = parsePrefix(prefix);
  let id, title, content, url, method;
  if (sj === null) {
    id = data.sections[si].id; title = data.sections[si].title; content = data.sections[si].content;
    url = `${API}/sections/${id}`; method = 'PUT';
  } else if (sk === null) {
    const sub = data.sections[si].subsections[sj];
    id = sub.id; title = sub.title; content = sub.content;
    url = `${API}/subsections/${id}`; method = 'PUT';
  } else {
    const it = data.sections[si].subsections[sj].items[sk];
    id = it.id; title = it.title; content = it.content;
    url = `${API}/items/${id}`; method = 'PUT';
  }

  showEditModal("Редактировать", title, content, async (t, c) => {
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: t, content: c })
    });
    await render();
  });
}

function onDelete(prefix) {
  const { si, sj, sk } = parsePrefix(prefix);
  let id, url;
  if (sj === null) {
    id = data.sections[si].id; url = `${API}/sections/${id}`;
  } else if (sk === null) {
    id = data.sections[si].subsections[sj].id; url = `${API}/subsections/${id}`;
  } else {
    id = data.sections[si].subsections[sj].items[sk].id; url = `${API}/items/${id}`;
  }
  if (!confirm("Удалить?")) return;
  fetch(url, { method: 'DELETE' }).then(render);
}

// Окно редактирования
function showEditModal(title, curTitle, curContent, onSave) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('titleInput').value = curTitle;
  document.getElementById('contentInput').value = curContent;
  document.getElementById('editModal').classList.add('active');
  currentEditTarget = onSave;
  setTimeout(() => document.getElementById('titleInput').focus(), 100);
}

function saveEdit() {
  const t = document.getElementById('titleInput').value.trim();
  const c = document.getElementById('contentInput').value.trim();
  if (!t) return alert("Заголовок не может быть пустым");
  currentEditTarget(t, c);
  closeModal();
}

function closeModal() {
  document.getElementById('editModal').classList.remove('active');
  currentEditTarget = null;
}

document.getElementById('editModal').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeModal();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
  if (e.key === 'Enter' && e.ctrlKey) saveEdit();
});

// Начало
render();
