import { buildTelegramUrl, buildVkUrl } from "./socialLinks";

// Строит "публичный" срез профиля для коллекции rosterPublic.
// Этот документ читают ВСЕ посетители сайта без исключения, поэтому сюда
// попадают только данные, которые действительно можно показывать всем:
// - вся игровая информация (состав/должность/статистика/заметки/награды/дисциплина)
// - контакты и дата рождения — ТОЛЬКО если владелец не скрыл их переключателем
export function buildRosterPublicPayload(profile) {
  const contacts = profile.extraContacts || {};
  const contactsPublic = profile.contactsPublic || {};
  const isPublic = (key) => contactsPublic[key] !== false;

  // Ссылки считаем с запасом: если предвычисленное поле уже есть и не пустое — используем
  // его, а если отсутствует или пустое (например, у профилей, зарегистрированных до появления
  // автоматической генерации ссылок) — вычисляем на лету из сырого ID.
  const telegramUrl = (profile.telegramUrl && profile.telegramUrl.trim()) ? profile.telegramUrl : buildTelegramUrl(contacts.telegram || "");
  const vkUrl = (profile.vkUrl && profile.vkUrl.trim()) ? profile.vkUrl : buildVkUrl(contacts.vk || "");

  return {
    callsign: profile.callsign || "",
    gamesInterested: profile.gamesInterested || [],
    gameRoles: profile.gameRoles || {},
    gameStats: profile.gameStats || {},
    gameNotes: profile.gameNotes || {},
    gameAwards: profile.gameAwards || {},
    globalAwards: profile.globalAwards || [],
    gameDisciplinaryActions: profile.gameDisciplinaryActions || {},
    globalDisciplinaryActions: profile.globalDisciplinaryActions || [],
    discordId: profile.discordId || "",
    steamId: profile.steamId || "",
    steamProfileUrl: profile.steamProfileUrl || "",
    armaId: profile.armaId || "",
    timezone: profile.timezone || "",
    referredByUid: profile.referredByUid || "",
    birthDate: profile.birthDatePublic ? (profile.birthDate || "") : "",
    publicContacts: {
      phone: isPublic("phone") ? (contacts.phone || "") : "",
      telegram: isPublic("telegram") ? (contacts.telegram || "") : "",
      vk: isPublic("vk") ? (contacts.vk || "") : "",
      other: isPublic("other") ? (contacts.other || "") : ""
    },
    telegramUrl: isPublic("telegram") ? telegramUrl : "",
    vkUrl: isPublic("vk") ? vkUrl : ""
  };
}
