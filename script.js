function createAccordionItem(title, content, level, id) {
  return `
          <div class="accordion-item level-${level}">
            <div class="accordion-toggle" onclick="toggleAccordion('${id}')">
              ${title}
            </div>
            <div class="accordion-content" id="${id}">
              <div class="accordion-content-inner">
                ${content}
              </div>
            </div>
          </div>
        `;
}

function generateFromArrays(titles, subtitles, contents) {
  const container = document.getElementById("accordion-container");
  let html = "";

  titles.forEach((title, index) => {
    const subtitle = subtitles[index] || [];
    const content = contents[index] || [];

    let sectionContent = `<p>Основное содержимое раздела: ${title}</p>`;

    subtitle.forEach((sub, subIndex) => {
      const subContent = content[subIndex] || [];
      let subsectionContent = `<p>Содержимое подраздела: ${sub}</p>`;

      if (Array.isArray(subContent)) {
        subContent.forEach((item, itemIndex) => {
          const itemId = `array-${index}-${subIndex}-${itemIndex}`;
          subsectionContent += createAccordionItem(
            `Элемент ${itemIndex + 1}`,
            `<p>${item}</p>`,
            3,
            itemId
          );
        });
      } else {
        subsectionContent += `<p>${subContent}</p>`;
      }

      const subsectionId = `array-sub-${index}-${subIndex}`;
      sectionContent += createAccordionItem(
        sub,
        subsectionContent,
        2,
        subsectionId
      );
    });

    const sectionId = `array-section-${index}`;
    html += createAccordionItem(title, sectionContent, 1, sectionId);
  });

  container.innerHTML = html;
}

function toggleAccordion(id) {
  const content = document.getElementById(id);
  const toggle = content.previousElementSibling;

  if (content.classList.contains("active")) {
    content.classList.remove("active");
    toggle.classList.remove("active");
  } else {
    content.classList.add("active");
    toggle.classList.add("active");
  }
}

const independentTitles = [
  "🔥 Школа Огня",
  "❄️ Школа Льда",
  "⚡ Школа Молний",
  "🔥 Школа Огня",
  "❄️ Школа Льда",
  "⚡ Школа Молний",
  "🔥 Школа Огня",
];

const independentSubtitles = [
  ["Базовые заклинания", "Продвинутые техники", "Базовые заклинания", "Продвинутые техники", "Базовые заклинания"],
  ["Базовые заклинания", "Продвинутые техники", "Базовые заклинания", "Продвинутые техники", "Базовые заклинания"],
  ["Базовые заклинания", "Продвинутые техники", "Базовые заклинания", "Продвинутые техники", "Базовые заклинания"],
];

const independentContents = [
  [
    ["Огненный шар", "Стена пламени", "Метеорит", "Огненный шар", "Стена пламени", "Метеорит", "Огненный шар", "Стена пламени"],
    ["Огненный шар", "Стена пламени", "Метеорит", "Огненный шар", "Стена пламени", "Метеорит", "Огненный шар", "Стена пламени"],
  ],
  [
    ["Огненный шар", "Стена пламени", "Метеорит", "Огненный шар", "Стена пламени", "Метеорит", "Огненный шар", "Стена пламени"],
    ["Огненный шар", "Стена пламени", "Метеорит", "Огненный шар", "Стена пламени", "Метеорит", "Огненный шар", "Стена пламени"],
  ],
  [
    ["Огненный шар", "Стена пламени", "Метеорит", "Огненный шар", "Стена пламени", "Метеорит", "Огненный шар", "Стена пламени"],
    ["Огненный шар", "Стена пламени", "Метеорит", "Огненный шар", "Стена пламени", "Метеорит", "Огненный шар", "Стена пламени"],
    ["Огненный шар", "Стена пламени", "Метеорит", "Огненный шар", "Стена пламени", "Метеорит", "Огненный шар", "Стена пламени"],
  ],
];

generateFromArrays(
  independentTitles,
  independentSubtitles,
  independentContents
);