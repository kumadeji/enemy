import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { pluralize } from "../utils/pluralize";
import { TIMES_FORMS } from "../data/statusForms";
import StatusBadges from "../components/StatusBadges";
import AwardChip from "../components/AwardChip";
import CopyableField from "../components/CopyableField";
import DisciplinaryList from "../components/DisciplinaryList";
import PrivacyToggleField from "../components/PrivacyToggleField";
import { ProfileTable, ProfileRow } from "../components/ProfileTable";

export default function Profile() {
  const { uid } = useParams();
  const { currentUser, isAdmin } = useAuth();
  const [p, setP] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [invitees, setInvitees] = useState([]);
  const [inviter, setInviter] = useState(null);
  const [activeGame, setActiveGame] = useState(null);
  const navigate = useNavigate();

  const targetUid = uid || currentUser?.uid;
  const isOwn = targetUid === currentUser?.uid;
  const canManagePrivacy = isOwn || isAdmin;

  useEffect(() => {
    async function load() {
      setP(null);
      setNotFound(false);
      let data;
      try {
        const snap = await getDoc(doc(db, "profiles", targetUid));
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
  }, [targetUid]);

  async function toggleBirthDatePublic() {
    const newVal = !p.birthDatePublic;
    await updateDoc(doc(db, "profiles", targetUid), { birthDatePublic: newVal });
    setP(prev => ({ ...prev, birthDatePublic: newVal }));
  }
  async function toggleContactsPublic() {
    const newVal = !p.extraContactsPublic;
    await updateDoc(doc(db, "profiles", targetUid), { extraContactsPublic: newVal });
    setP(prev => ({ ...prev, extraContactsPublic: newVal }));
  }

  if (notFound) return <main className="container"><p>Личное дело не найдено.</p></main>;
  if (!p) return <main className="container"><p>Загрузка...</p></main>;

  const contacts = p.extraContacts || {};
  const playedGames = p.gamesInterested || [];
  const gameRole = activeGame ? p.gameRoles?.[activeGame] : null;
  const isPending = gameRole?.composition === "Отбор";

  const showBirthDate = p.birthDatePublic || canManagePrivacy;
  const showContacts = p.extraContactsPublic || canManagePrivacy;
  const hasAnyContact = contacts.phone || contacts.telegram || contacts.vk || contacts.other;

  return (
    <main className="container">
      <h1>Личное дело бойца</h1>

      {/* ---------- Блок 1: Анкета (общая информация, не привязана к игре) ---------- */}
      <div className="card">
        <div className="profile-block-title">Анкета</div>
        <h2>{p.callsign}</h2>

        {isOwn && isPending && (
          <div className="pending-notice">
            <div className="pending-notice-title">📋 Заявка на рассмотрении</div>
            <p>Ваша заявка получена и находится на рассмотрении командира батальона и его заместителей. Ожидайте — как только статус изменится, это сообщение исчезнет.</p>
          </div>
        )}

        {(p.globalDisciplinaryActions?.length > 0) && (
          <DisciplinaryList actions={p.globalDisciplinaryActions} showHistory={false} />
        )}

        <ProfileTable>
          <ProfileRow label="Игры">{playedGames.join(", ")}</ProfileRow>
          <ProfileRow label="Discord ID">{p.discordId}</ProfileRow>
          <ProfileRow label="Steam ID"><CopyableField value={p.steamId} /></ProfileRow>
          <ProfileRow label="Ссылка на Steam"><a href={p.steamProfileUrl} target="_blank" rel="noreferrer">{p.steamProfileUrl}</a></ProfileRow>
          {p.armaId && <ProfileRow label="Arma ID"><CopyableField value={p.armaId} /></ProfileRow>}
          {p.timezone && <ProfileRow label="Часовой пояс">{p.timezone}</ProfileRow>}

          {showBirthDate && p.birthDate && (
            <ProfileRow label="Дата рождения">
              <PrivacyToggleField isPublic={p.birthDatePublic} canToggle={canManagePrivacy} onToggle={toggleBirthDatePublic}>
                {p.birthDate}
              </PrivacyToggleField>
            </ProfileRow>
          )}

          {showContacts && hasAnyContact && (
            <ProfileRow label="Дополнительные контакты">
              <PrivacyToggleField isPublic={p.extraContactsPublic} canToggle={canManagePrivacy} onToggle={toggleContactsPublic}>
                <span className="contacts-list">
                  {contacts.phone && <span>{contacts.phone}</span>}
                  {contacts.telegram && <a href={p.telegramUrl} target="_blank" rel="noreferrer">Ссылка на Telegram</a>}
                  {contacts.vk && <a href={p.vkUrl} target="_blank" rel="noreferrer">Ссылка на ВКонтакте</a>}
                  {contacts.other && <span>{contacts.other}</span>}
                </span>
              </PrivacyToggleField>
            </ProfileRow>
          )}

          {inviter && (
            <ProfileRow label="Кем приглашён">
              <Link to={`/profile/${inviter.uid}`}>{inviter.callsign}</Link>
            </ProfileRow>
          )}
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
            : <span className="hint">Пока нет общих наград.</span>}
        </div>

        {isOwn && (
          <button type="button" className="btn secondary profile-edit-btn" onClick={() => navigate("/my-application")}>
            Редактировать анкету
          </button>
        )}
      </div>

      {/* ---------- Блок 2: информация с привязкой к играм ---------- */}
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
              <span className="stat-label">{pluralize(p.gameStats?.[activeGame]?.playedAsSoldierCount || 0, TIMES_FORMS)} отыграл как боец</span>
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
              : <span className="hint">Пока нет игровых наград.</span>}
          </div>
        </div>
      )}
    </main>
  );
}
