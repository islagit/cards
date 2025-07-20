let data = { sections: [] };
let currentEditTarget = null;

function saveData() {
  const dataStr = JSON.stringify(data);
  window.accordionData = dataStr;
}

function loadData() {
  if (window.accordionData) {
    data = JSON.parse(window.accordionData);
  } else {
    data = { sections: [] };
  }
}

function saveOpenState() {
  const openIds = Array.from(
    document.querySelectorAll(".accordion-content.active")
  ).map((el) => el.id);
  window.accordionOpen = JSON.stringify(openIds);
}

function restoreOpenState() {
  if (!window.accordionOpen) return;
  JSON.parse(window.accordionOpen).forEach((id) => {
    const content = document.getElementById(id);
    if (content) {
      content.classList.add("active");
      content.previousElementSibling.classList.add("active");
      const icon =
        content.previousElementSibling.querySelector(".toggle-icon");
      if (icon) icon.textContent = "−";
    }
  });
}

function parsePrefix(prefix) {
  const m = prefix.match(/^sec-(\d+)(?:-sub-(\d+)(?:-item-(\d+))?)?$/);
  return m
    ? {
      si: +m[1],
      sj: m[2] != null ? +m[2] : null,
      sk: m[3] != null ? +m[3] : null,
    }
    : {};
}

function createCrudButtons(prefix, level) {
  const addLabel =
    level === 1
      ? "Добавить подраздел"
      : level === 2
        ? "Добавить элемент"
        : "Добавить элемент";
  return `
          <button class="crud-btn add" onclick="onAdd('${prefix}')" title="${addLabel}">＋</button>
          <button class="crud-btn edit" onclick="onEdit('${prefix}')" title="Редактировать">✏️</button>
          <button class="crud-btn delete" onclick="onDelete('${prefix}')" title="Удалить">🗑️</button>
        `;
}

function createAccordionItem(title, content, inner, level, id, prefix) {
  const isOpen = document
    .getElementById(id)
    ?.classList.contains("active");
  return `
          <div class="accordion-item level-${level}">
            <div class="accordion-toggle ${isOpen ? "active" : ""
    }" onclick="toggleAccordion('${id}')">
              <div class="toggle-left">
                <div class="toggle-title">${title}</div>
              </div>
              <div class="toggle-right">
                ${createCrudButtons(prefix, level)}
                <div class="toggle-icon">${isOpen ? "−" : "+"}</div>
              </div>
            </div>
            <div class="accordion-content ${isOpen ? "active" : ""}" id="${id}">
              ${content ? `<div class="content-text">${content}</div>` : ""}
              ${inner}
            </div>
          </div>`;
}

function generateFromData() {
  const container = document.getElementById("accordion-container");
  let html = "";

  data.sections.forEach((sec, i) => {
    const secId = `sec-${i}`;
    const secPref = secId;
    let inner = "";

    if (sec.subsections && sec.subsections.length > 0) {
      sec.subsections.forEach((sub, j) => {
        const subId = `${secPref}-sub-${j}`;
        const subPref = subId;
        let subInner = "";

        if (sub.items && sub.items.length > 0) {
          sub.items.forEach((it, k) => {
            const itmId = `${subPref}-item-${k}`;
            const itmPref = itmId;
            subInner += createAccordionItem(
              `Элемент ${k + 1}: ${it.title || it}`,
              typeof it === "object" ? it.content : it,
              "",
              3,
              itmId,
              itmPref
            );
          });
        }

        inner += createAccordionItem(
          sub.title,
          sub.content || "",
          subInner,
          2,
          subId,
          subPref
        );
      });
    }

    html += createAccordionItem(
      sec.title,
      sec.content || "",
      inner,
      1,
      secId,
      secPref
    );
  });

  container.innerHTML = html;
  restoreOpenState();
}

function render() {
  loadData();
  generateFromData();
}

function toggleAccordion(id) {
  const c = document.getElementById(id);
  const t = c.previousElementSibling;
  const icon = t.querySelector(".toggle-icon");

  c.classList.toggle("active");
  t.classList.toggle("active");

  if (icon) {
    icon.textContent = c.classList.contains("active") ? "−" : "+";
  }

  saveOpenState();
}

function addRootSection() {
  showEditModal("Добавить новую секцию", "", "", (title, content) => {
    data.sections.push({
      title: title,
      content: content,
      subsections: [],
    });
    saveData();
    render();
  });
}

function onAdd(prefix) {
  const { si, sj, sk } = parsePrefix(prefix);

  if (sj === null) {
    showEditModal("Добавить подраздел", "", "", (title, content) => {
      data.sections[si].subsections.push({
        title: title,
        content: content,
        items: [],
      });
      saveData();
      render();
    });
  } else if (sk === null) {
    showEditModal("Добавить элемент", "", "", (title, content) => {
      data.sections[si].subsections[sj].items.push({
        title: title,
        content: content,
      });
      saveData();
      render();
    });
  } else {
    showEditModal("Добавить элемент", "", "", (title, content) => {
      data.sections[si].subsections[sj].items.splice(sk + 1, 0, {
        title: title,
        content: content,
      });
      saveData();
      render();
    });
  }
}

function onEdit(prefix) {
  const { si, sj, sk } = parsePrefix(prefix);
  let currentTitle = "";
  let currentContent = "";

  if (sj === null) {
    currentTitle = data.sections[si].title;
    currentContent = data.sections[si].content || "";
  } else if (sk === null) {
    currentTitle = data.sections[si].subsections[sj].title;
    currentContent = data.sections[si].subsections[sj].content || "";
  } else {
    const item = data.sections[si].subsections[sj].items[sk];
    currentTitle = typeof item === "object" ? item.title : item;
    currentContent = typeof item === "object" ? item.content || "" : "";
  }

  showEditModal(
    "Редактировать",
    currentTitle,
    currentContent,
    (title, content) => {
      if (sj === null) {
        data.sections[si].title = title;
        data.sections[si].content = content;
      } else if (sk === null) {
        data.sections[si].subsections[sj].title = title;
        data.sections[si].subsections[sj].content = content;
      } else {
        data.sections[si].subsections[sj].items[sk] = {
          title: title,
          content: content,
        };
      }
      saveData();
      render();
    }
  );
}

function onDelete(prefix) {
  const { si, sj, sk } = parsePrefix(prefix);

  if (!confirm(`Удалить "${prefix}"? Это действие нельзя отменить.`))
    return;

  if (sj === null) {
    data.sections.splice(si, 1);
  } else if (sk === null) {
    data.sections[si].subsections.splice(sj, 1);
  } else {
    data.sections[si].subsections[sj].items.splice(sk, 1);
  }

  saveData();
  render();
}

function showEditModal(title, currentTitle, currentContent, onSave) {
  document.getElementById("modalTitle").textContent = title;
  document.getElementById("titleInput").value = currentTitle;
  document.getElementById("contentInput").value = currentContent;
  document.getElementById("editModal").classList.add("active");

  currentEditTarget = onSave;

  setTimeout(() => {
    document.getElementById("titleInput").focus();
  }, 100);
}

function saveEdit() {
  const title = document.getElementById("titleInput").value.trim();
  const content = document.getElementById("contentInput").value.trim();

  if (!title) {
    alert("Заголовок не может быть пустым!");
    return;
  }

  if (currentEditTarget) {
    currentEditTarget(title, content);
  }

  closeModal();
}

function closeModal() {
  document.getElementById("editModal").classList.remove("active");
  currentEditTarget = null;
}

document
  .getElementById("editModal")
  .addEventListener("click", function (e) {
    if (e.target === this) {
      closeModal();
    }
  });

document.addEventListener("keydown", function (e) {
  if (
    e.key === "Escape" &&
    document.getElementById("editModal").classList.contains("active")
  ) {
    closeModal();
  }
  if (
    e.key === "Enter" &&
    e.ctrlKey &&
    document.getElementById("editModal").classList.contains("active")
  ) {
    saveEdit();
  }
});

if (!window.accordionData) {
  data = {
    sections: [
      {
        title: "🔥 Огонь",
        content: "Магические заклинания огненной стихии для боя и защиты",
        subsections: [
          {
            title: "Базовые заклинания",
            content: "Простые заклинания для начинающих магов",
            items: [
              {
                title: "Огненный шар",
                content:
                  "Базовое боевое заклинание. Создает сферу пламени, которая наносит урон противнику.",
              },
              {
                title: "Огненная стена",
                content:
                  "Защитное заклинание. Создает барьер из пламени, блокирующий проход.",
              },
            ],
          },
          {
            title: "Продвинутые заклинания",
            content: "Мощные заклинания для опытных магов",
            items: [
              {
                title: "Метеорит",
                content:
                  "Призывает горящий камень с неба. Наносит массивный урон по площади.",
              },
            ],
          },
        ],
      },
      {
        title: "❄️ Лёд",
        content: "Заклинания ледяной магии для контроля и урона",
        subsections: [
          {
            title: "Базовые заклинания",
            content: "Основы ледяной магии",
            items: [
              {
                title: "Ледяной шар",
                content:
                  "Замораживает противника и наносит урон холодом.",
              },
            ],
          },
          {
            title: "Продвинутые заклинания",
            content: "Мощная ледяная магия",
            items: [
              {
                title: "Ледяной шторм",
                content:
                  "Создает метель, которая замедляет и повреждает всех врагов в области.",
              },
            ],
          },
        ],
      },
      {
        title: "⚡ Молния",
        content: "Быстрые и точные заклинания электричества",
        subsections: [
          {
            title: "Базовые заклинания",
            items: [
              {
                title: "Молния",
                content: "Мгновенная атака электричеством.",
              },
            ],
          },
          {
            title: "Продвинутые заклинания",
            items: [
              {
                title: "Цепная молния",
                content:
                  "Молния, которая перескакивает между несколькими целями.",
              },
            ],
          },
          {
            title: "Экспертные заклинания",
            content: "Для мастеров электромагии",
            items: [
              {
                title: "Электрический шок",
                content: "Парализует противника мощным разрядом.",
              },
            ],
          },
        ],
      },
    ],
  };
  saveData();
}

render();