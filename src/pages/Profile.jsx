import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { pluralize } from "../utils/pluralize";
import { TIMES_FORMS } from "../data/statusForms";
import { buildRosterPublicPayload } from "../utils/rosterPublic";
import { buildTelegramUrl, buildVkUrl } from "../utils/socialLinks";
import StatusBadges from "../components/StatusBadges";
import AwardChip from "../components/AwardChip";
import CopyableField from "../components/CopyableField";
import DisciplinaryList from "../components/DisciplinaryList";
import PrivacyToggleField from "../components/PrivacyToggleField";
import { ProfileTable, ProfileRow } from "../components/ProfileTable";
import { sendYandexGoal } from "../utils/yandexMetrica";

export default function Profile() {
  const { uid } = useParams();
  const { currentUser } = useAuth();
  const [p, setP] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [invitees, setInvitees] = useState([]);
  const [inviter, setInviter] = useState(null);
  const [activeGame, setActiveGame] = useState(null);
  const navigate = useNavigate();

  const targetUid = uid || currentUser?.uid;
  const isOwn = targetUid === currentUser?.uid;

  // Отправляем событие просмотра профиля
  useEffect(() => {
    if (targetUid && p) {
      sendYandexGoal(isOwn ? 'view_own_profile' : 'view_other_profile', {
        profileUid: targetUid,
        callsign: p.callsign
      });
    }
  }, [targetUid, isOwn, p]);

  useEffect(() => {
    async function load() {
      setP(null);
      setNotFound(false);
      setInviter(null);
      setInvitees([]);

      // Свой профиль — из приватной коллекции (можно управлять приватностью).
      // Чужой профиль — всегда из уже отфильтрованной публичной копии.
      const sourceCollection = isOwn ? "profiles" : "rosterPublic";

      let data;
      try {
        const snap = await getDoc(doc(db, sourceCollection, targetUid));
        if (!snap.exists()) { setNotFound(true); return; }
        data = snap.data();
      } catch {
        setNotFound(true);
        return;
      }
      setP(data);
      setActiveGame(data.gamesInterested?.[0] || null);

      const q = query(collection(db, "rosterPublic"), where("referredByUid", "==", targetUid));
      const inviteSnap = await getDocs(q);
      setInvitees(inviteSnap.docs.map(d => ({ uid: d.id, callsign: d.data().callsign })));

      if (data.referredByUid) {
        const invSnap = await getDoc(doc(db, "rosterPublic", data.referredByUid));
        if (invSnap.exists()) setInviter({ uid: data.referredByUid, callsign: invSnap.data().callsign });
      }
    }
    if (targetUid) load();
  }, [targetUid, isOwn]);

  async function syncRosterPublicAfterToggle(updatedProfile) {
    await updateDoc(doc(db, "rosterPublic", targetUid), buildRosterPublicPayload(updatedProfile));
  }

  async function toggleBirthDatePublic() {
    const updated = { ...p, birthDatePublic: !p.birthDatePublic };
    await updateDoc(doc(db, "profiles", targetUid), { birthDatePublic: updated.birthDatePublic });
    await syncRosterPublicAfterToggle(updated);
    setP(updated);
    // Отправляем событие в Яндекс Метрику
    sendYandexGoal('toggle_privacy', { field: 'birthDate', isPublic: updated.birthDatePublic });
  }

  async function toggleContactField(key) {
    const current = p.contactsPublic || {};
    const newContactsPublic = { ...current, [key]: current[key] === false ? true : false };
    const updated = { ...p, contactsPublic: newContactsPublic };
    await updateDoc(doc(db, "profiles", targetUid), { contactsPublic: newContactsPublic });
    await syncRosterPublicAfterToggle(updated);
    setP(updated);
    // Отправляем событие в Яндекс Метрику
    sendYandexGoal('toggle_privacy', { field: key, isPublic: newContactsPublic[key] !== false });
  }

  if (notFound) return <main className="container"><p>Личное дело не найдено.</p></main>;
  if (!p) return <main className="container"><p>Загрузка...</p></main>;

  // Для своего профиля контакты берём из "сырого" extraContacts + флагов
  // contactsPublic (нужен toggle). Для чужого — уже готовый publicContacts
  // (там пусто там, где скрыто, toggle не нужен и не показывается).
  const contacts = isOwn ? (p.extraContacts || {}) : (p.publicContacts || {});
  const contactsPublic = p.contactsPublic || {};
  const isFieldPublic = (key) => contactsPublic[key] !== false;

  // Вычисляем ссылки с fallback: если предвычисленное поле отсутствует или пустое,
  // строим ссылку из сырого ID на лету (для своего профиля из profiles,
  // для чужого — из rosterPublic/publicContacts, где уже должно быть посчитано,
  // но на всякий случай делаем fallback).
  const telegramUrl = (p.telegramUrl && p.telegramUrl.trim()) ? p.telegramUrl : buildTelegramUrl(contacts.telegram || "");
  const vkUrl = (p.vkUrl && p.vkUrl.trim()) ? p.vkUrl : buildVkUrl(contacts.vk || "");

  const playedGames = p.gamesInterested || [];
  const gameRole = activeGame ? p.gameRoles?.[activeGame] : null;
  const isPending = gameRole?.composition === "Отбор";
  const showBirthDate = isOwn ? true : !!p.birthDate;

  return (
    <main className="container">
      <h1>Личное дело: {p.callsign}</h1>

      {/* ---------- Блок 1: Анкета ---------- */}
      <div className="card">
        <div className="profile-block-title">Публичная анкета</div>

        {isOwn && isPending && (
          <div className="pending-notice">
            <div className="pending-notice-title">📋 Заявка на рассмотрении</div>
            <p>Ваша заявка получена и находится на рассмотрении командира батальона и его заместителей. Как только вас примут, это сообщение исчезнет.</p>
          </div>
        )}

        {(p.globalDisciplinaryActions?.length > 0) && (
          <DisciplinaryList actions={p.globalDisciplinaryActions} showHistory={false} />
        )}

        <ProfileTable>
          <ProfileRow label="Игры">{playedGames.join(", ")}</ProfileRow>
          <ProfileRow label="Discord ID"><CopyableField value={p.discordId} /></ProfileRow>
          <ProfileRow label="Steam ID"><CopyableField value={p.steamId} /></ProfileRow>
          <ProfileRow label="Ссылка на Steam"><a href={p.steamProfileUrl} target="_blank" rel="noreferrer">{p.steamProfileUrl}</a></ProfileRow>
          {p.armaId && <ProfileRow label="Arma ID"><CopyableField value={p.armaId} /></ProfileRow>}
          {p.timezone && <ProfileRow label="Часовой пояс">{p.timezone}</ProfileRow>}

          {showBirthDate && p.birthDate && (
            <ProfileRow label="Дата рождения">
              {isOwn ? (
                <PrivacyToggleField isPublic={p.birthDatePublic} onToggle={toggleBirthDatePublic}>
                  {p.birthDate}
                </PrivacyToggleField>
              ) : (
                <span>{p.birthDate}</span>
              )}
            </ProfileRow>
          )}

          {contacts.phone && (
            <ProfileRow label="Телефон">
              {isOwn ? (
                <PrivacyToggleField isPublic={isFieldPublic("phone")} onToggle={() => toggleContactField("phone")}>
                  {contacts.phone}
                </PrivacyToggleField>
              ) : (
                <span>{contacts.phone}</span>
              )}
            </ProfileRow>
          )}
          {contacts.telegram && (
            <ProfileRow label="Ссылка на Telegram">
              {isOwn ? (
                <PrivacyToggleField isPublic={isFieldPublic("telegram")} onToggle={() => toggleContactField("telegram")}>
                  <a href={telegramUrl} target="_blank" rel="noreferrer">{telegramUrl}</a>
                </PrivacyToggleField>
              ) : (
                <a href={telegramUrl} target="_blank" rel="noreferrer">{telegramUrl}</a>
              )}
            </ProfileRow>
          )}
          {contacts.vk && (
            <ProfileRow label="Ссылка на ВКонтакте">
              {isOwn ? (
                <PrivacyToggleField isPublic={isFieldPublic("vk")} onToggle={() => toggleContactField("vk")}>
                  <a href={vkUrl} target="_blank" rel="noreferrer">{vkUrl}</a>
                </PrivacyToggleField>
              ) : (
                <a href={vkUrl} target="_blank" rel="noreferrer">{vkUrl}</a>
              )}
            </ProfileRow>
          )}
          {contacts.other && (
            <ProfileRow label="Другой контакт">
              {isOwn ? (
                <PrivacyToggleField isPublic={isFieldPublic("other")} onToggle={() => toggleContactField("other")}>
                  {contacts.other}
                </PrivacyToggleField>
              ) : (
                <span>{contacts.other}</span>
              )}
            </ProfileRow>
          )}

          {inviter && <ProfileRow label="Кем приглашён"><Link to={`/profile/${inviter.uid}`}>{inviter.callsign}</Link></ProfileRow>}
          {invitees.length > 0 && (
            <ProfileRow label="Кого пригласил">
              {invitees.map((inv, i) => (
                <span key={inv.uid}>{i > 0 && ", "}<Link to={`/profile/${inv.uid}`}>{inv.callsign}</Link></span>
              ))}
            </ProfileRow>
          )}
        </ProfileTable>

        <p><b>Награды сообщества:</b></p>
        <div className="awards-list">
          {(p.globalAwards || []).length
            ? p.globalAwards.map((a, i) => <AwardChip key={i} icon={a.icon} name={a.name} description={a.description} />)
            : <span className="hint">Пока нет общих наград. Трудись, боец!</span>}
        </div>

        {isOwn && (
          <>
            <button type="button" className="btn secondary profile-edit-btn" onClick={() => { sendYandexGoal('click_edit_profile'); navigate("/my-application"); }}>
              Редактировать свою анкету
            </button>
            <button type="button" className="btn secondary profile-edit-btn" onClick={() => { sendYandexGoal('click_account_settings'); navigate("/account"); }}>
              Изменить данные для авторизации
            </button>
          </>
        )}

      </div>

      {/* ---------- Блок 2: по игре ---------- */}
      {activeGame && (
        <div className="card">
          <div className="profile-block-title">По игре</div>

          {playedGames.length > 1 && (
            <div className="game-tabs">
              {playedGames.map(g => (
                <button key={g} type="button" className={`tab-btn ${activeGame === g ? "active" : ""}`} onClick={() => setActiveGame(g)}>{g}</button>
              ))}
            </div>
          )}

          {p.gameNotes?.[activeGame] && (
            <div className="handwritten-note">
              <span className="handwritten-note-label">Комбат о бойце</span>
              <p className="handwritten-note-text">«{p.gameNotes[activeGame]}»</p>
            </div>
          )}

          <StatusBadges gameRole={gameRole} />

          {(p.gameDisciplinaryActions?.[activeGame]?.length > 0) && (
            <DisciplinaryList actions={p.gameDisciplinaryActions[activeGame]} showHistory={false} />
          )}

          <p><b>Боевые заслуги ({activeGame}):</b></p>
          <div className="profile-stats-row">
            <div className="profile-stat-card">
              <span className="stat-value">{p.gameStats?.[activeGame]?.playedAsSoldierCount || 0}</span>
              <span className="stat-label">{pluralize(p.gameStats?.[activeGame]?.playedAsSoldierCount || 0, TIMES_FORMS)} отыграл за бойца</span>
            </div>
            <div className="profile-stat-card">
              <span className="stat-value">{p.gameStats?.[activeGame]?.koCount || 0}</span>
              <span className="stat-label">{pluralize(p.gameStats?.[activeGame]?.koCount || 0, TIMES_FORMS)} отыграл за КО</span>
            </div>
            <div className="profile-stat-card">
              <span className="stat-value">{p.gameStats?.[activeGame]?.ksCount || 0}</span>
              <span className="stat-label">{pluralize(p.gameStats?.[activeGame]?.ksCount || 0, TIMES_FORMS)} отыграл за КС</span>
            </div>
          </div>

          <p><b>Награды ({activeGame}):</b></p>
          <div className="awards-list">
            {(p.gameAwards?.[activeGame] || []).length
              ? p.gameAwards[activeGame].map((a, i) => <AwardChip key={i} icon={a.icon} name={a.name} description={a.description} />)
              : <span className="hint">Пока нет игровых наград. Трудись, боец!</span>}
          </div>
        </div>
      )}
    </main>
  );
}
