import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { pluralize } from "../utils/pluralize";
import { TIMES_FORMS } from "../data/statusForms";
import { GAMES } from "../data/gameRoles";
import StatusBadges from "../components/StatusBadges";
import AwardChip from "../components/AwardChip";
import CopyableField from "../components/CopyableField";
import DisciplinaryList from "../components/DisciplinaryList";
import { ProfileTable, ProfileRow } from "../components/ProfileTable";

export default function Profile() {
  const { uid } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [profileData, setProfileData] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [invitees, setInvitees] = useState([]);
  const [activeGame, setActiveGame] = useState(null);

  const targetUid = uid || currentUser?.uid;
  const isOwn = targetUid === currentUser?.uid;
  
  useEffect(() => {
    async function load() {
      setProfileData(null);
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
  
      setProfileData(data);
  
      const firstGame = data.gamesInterested?.[0] || GAMES[0];
      setActiveGame(firstGame);
  
      const q = query(collection(db, "profiles"), where("referredByUid", "==", targetUid));
      const inviteSnap = await getDocs(q);
      setInvitees(inviteSnap.docs.map(d => ({ uid: d.id, callsign: d.data().callsign })));
    }
    if (targetUid) load();
  }, [targetUid, currentUser]);
  
  if (notFound) return <main className="container"><p>Личное дело не найдено.</p></main>;
  if (!profileData || !activeGame) return <main className="container"><p>Загрузка...</p></main>;

  const p = profileData;
  const contacts = p.extraContacts || {};
  const gameRole = p.gameRoles?.[activeGame];
  const playedGames = p.gamesInterested || [];

  return (
    <main className="container">
      <h1>Личное дело бойца</h1>
      <div className="card">
        <h2>{p.callsign}</h2>

        {p.publicNote && (
          <div className="handwritten-note">
            <span className="handwritten-note-label">Комбат о бойце</span>
            <p className="handwritten-note-text">«{p.publicNote}»</p>
          </div>
        )}

        <DisciplinaryList actions={p.disciplinaryActions || []} showHistory={false} />

        {playedGames.length > 1 && (
          <div className="game-tabs">
            {playedGames.map(g => (
              <button
                key={g}
                type="button"
                className={`tab-btn ${activeGame === g ? "active" : ""}`}
                onClick={() => setActiveGame(g)}
              >
                {g}
              </button>
            ))}
          </div>
        )}

        {gameRole ? (
          <StatusBadges gameRole={gameRole} />
        ) : (
          <p className="hint">Нет должности в выбранной игре.</p>
        )}

        <ProfileTable>
          <ProfileRow label="Игры">{playedGames.join(", ")}</ProfileRow>
          <ProfileRow label="Discord ID">{p.discordId}</ProfileRow>
          <ProfileRow label="Steam ID"><CopyableField value={p.steamId} /></ProfileRow>
          <ProfileRow label="Ссылка на Steam">
            <a href={p.steamProfileUrl} target="_blank" rel="noreferrer">{p.steamProfileUrl}</a>
          </ProfileRow>
          {p.armaId && (
            <ProfileRow label="Arma ID"><CopyableField value={p.armaId} /></ProfileRow>
          )}
          {p.timezone && <ProfileRow label="Часовой пояс">{p.timezone}</ProfileRow>}
          {p.birthDate && <ProfileRow label="Дата рождения">{p.birthDate}</ProfileRow>}
          {contacts.phone && <ProfileRow label="Телефон">{contacts.phone}</ProfileRow>}
          {contacts.telegram && <ProfileRow label="Telegram">{contacts.telegram}</ProfileRow>}
          {contacts.vk && <ProfileRow label="ВКонтакте">{contacts.vk}</ProfileRow>}
          {contacts.other && <ProfileRow label="Другой контакт">{contacts.other}</ProfileRow>}
          {invitees.length > 0 && (
            <ProfileRow label="Кого пригласил">
              {invitees.map((inv, i) => (
                <span key={inv.uid}>
                  {i > 0 && ", "}
                  <Link to={`/profile/${inv.uid}`}>{inv.callsign}</Link>
                </span>
              ))}
            </ProfileRow>
          )}
        </ProfileTable>

        <p><b>Боевые заслуги:</b></p>
        <div className="profile-stats-row">
          <div className="profile-stat-card">
            <span className="stat-value">{p.playedAsSoldierCount || 0}</span>
            <span className="stat-label">{pluralize(p.playedAsSoldierCount || 0, TIMES_FORMS)} отыграл как боец</span>
          </div>
          <div className="profile-stat-card">
            <span className="stat-value">{p.koCount || 0}</span>
            <span className="stat-label">{pluralize(p.koCount || 0, TIMES_FORMS)} отыграл за КО</span>
          </div>
          <div className="profile-stat-card">
            <span className="stat-value">{p.ksCount || 0}</span>
            <span className="stat-label">{pluralize(p.ksCount || 0, TIMES_FORMS)} отыграл за КС</span>
          </div>
        </div>

        <p><b>Награды:</b></p>
        <div className="awards-list">
          {(p.awards || []).length
            ? p.awards.map((a, i) => <AwardChip key={i} icon={a.icon} name={a.name || a.desc} description={a.description || ""} />)
            : <span className="hint">Пока нет наград, трудись, боец!</span>}
        </div>

        {isOwn && (
          <button type="button" className="btn secondary profile-edit-btn" onClick={() => navigate("/my-application")}>
            Редактировать личное дело
          </button>
        )}
      </div>
    </main>
  );
}