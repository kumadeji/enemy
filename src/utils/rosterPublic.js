import { buildTelegramUrl, buildVkUrl } from "./socialLinks";
import { collection, getDocs, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

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


// Пересобирает rosterPublic для ВСЕХ бойцов на основе актуальных profiles.
// Нужно, чтобы починить рассинхрон после ручного редактирования статистики
// (или чего угодно ещё) прямо в консоли Firebase, в обход сайта.
// Доступно только администраторам — обычный клиент не имеет прав на чтение
// всей коллекции profiles (там личные данные всех бойцов), это ограничение
// Firestore Security Rules, а не этой функции.
export async function resyncAllRosterPublic() {
  const profilesSnap = await getDocs(collection(db, "profiles"));
  let count = 0;
  for (const docSnap of profilesSnap.docs) {
    const uid = docSnap.id;
    const p = docSnap.data();
    await setDoc(doc(db, "rosterPublic", uid), buildRosterPublicPayload(p));
    count++;
  }
  await setDoc(doc(db, "meta", "statsSync"), { updatedAt: serverTimestamp() });
  return count;
}
