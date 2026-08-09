export function buildTelegramUrl(telegramId) {
  const trimmed = (telegramId || "").trim().replace(/^@/, "");
  if (!trimmed) return "";
  return `https://t.me/${trimmed}`;
}

export function buildVkUrl(vkId) {
  const trimmed = (vkId || "").trim().replace(/^@/, "");
  if (!trimmed) return "";
  if (/^\d+$/.test(trimmed)) return `https://vk.ru/id${trimmed}`;
  if (/^id\d+$/i.test(trimmed)) return `https://vk.ru/${trimmed.toLowerCase()}`;
  return `https://vk.ru/${trimmed}`;
}
