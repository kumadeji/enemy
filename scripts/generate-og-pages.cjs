const fs = require("fs");
const path = require("path");

const distDir = path.join(__dirname, "..", "dist");
const indexPath = path.join(distDir, "index.html");

// Только публичные, маркетингово значимые страницы — на закрытых разделах
// (личные дела, админка, очередь и т.п.) превью всё равно не покажет
// ничего осмысленного гостю, поэтому им оставляем общий og с главной.
const ROUTES = [
  { path: "/apply", title: "Заявка на вступление", description: "Подача заявки на вступление в мультиигровое сообщество ENEMY. Закрытое направление по игре Arma Reforger." },
  { path: "/login", title: "Вход", description: "Вход в личный кабинет бойца мультиигрового сообщества ENEMY." },
  { path: "/forgot-password", title: "Восстановление пароля", description: "Восстановление доступа к личному кабинету бойца мультиигрового сообщества ENEMY." },
  { path: "/roster", title: "Состав", description: "Публичный состав мультиигрового сообщества ENEMY: бойцы, составы и должности." },
  { path: "/media", title: "Видео", description: "Видеоконтент мультиигрового сообщества ENEMY: геймплей, обучающие ролики и другие видео и стримы от бойцов." },
  { path: "/charter", title: "Устав и манифест", description: "Устав и манифест мультиигрового сообщества ENEMY: правила, структура направлений и принципы поведения бойцов." },
  { path: "/history", title: "История", description: "История мультиигрового сообщества ENEMY: как менялся наш клан, а вместе с ним и мы сами." },
];

function buildHtmlFor(baseHtml, route) {
  const fullTitle = `${route.title} — ENEMY`;
  const url = `https://mis-enemy.ru${route.path}`;

  return baseHtml
    .replace(
      "<title>ENEMY — Мультиигровое сообщество</title>",
      `<title>${fullTitle}</title>`
    )
    .replace(
      /<meta name="description" content=".*?" \/>/,
      `<meta name="description" content="${route.description}" />`
    )
    .replace(
      '<meta property="og:title" content="ENEMY — Мультиигровое сообщество" />',
      `<meta property="og:title" content="${fullTitle}" />`
    )
    .replace(
      /<meta property="og:description" content=".*?" \/>/,
      `<meta property="og:description" content="${route.description}" />`
    )
    .replace(
      /<meta property="og:url" content=".*?" \/>/,
      `<meta property="og:url" content="${url}" />`
    )
    .replace(
      '<meta name="twitter:title" content="ENEMY — Мультиигровое сообщество" />',
      `<meta name="twitter:title" content="${fullTitle}" />`
    )
    .replace(
      /<meta name="twitter:description" content=".*?" \/>/,
      `<meta name="twitter:description" content="${route.description}" />`
    );
}

function run() {
  if (!fs.existsSync(indexPath)) {
    console.error("[OG pages] dist/index.html не найден — сначала выполните vite build.");
    process.exit(1);
  }
  const baseHtml = fs.readFileSync(indexPath, "utf8");

  for (const route of ROUTES) {
    const targetDir = path.join(distDir, route.path.replace(/^\//, ""));
    fs.mkdirSync(targetDir, { recursive: true });
    const html = buildHtmlFor(baseHtml, route);
    fs.writeFileSync(path.join(targetDir, "index.html"), html, "utf8");
    console.log(`[OG pages] Сгенерирован: ${route.path}/index.html`);
  }
}

run();
