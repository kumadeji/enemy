import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import StatusBadges from "../components/StatusBadges";
import { useAuth } from "../context/AuthContext";
import { pluralize } from "../utils/pluralize";
import { TIMES_FORMS } from "../data/statusForms";
import AwardChip from "../components/AwardChip";

export default function Profile() {
  const { uid } = useParams();
  const { currentUser } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [notFound, setNotFound] = useState(false);

  const targetUid = uid || currentUser?.uid;
  const isOwn = targetUid === currentUser?.uid;

  useEffect(() => {
    async function load() {
      setProfileData(null);
      const snap = await getDoc(doc(db, "profiles", targetUid));
      if (snap.exists()) setProfileData(snap.data());
      else setNotFound(true);
    }
    if (targetUid) load();
  }, [targetUid]);

  if (notFound) return <main className="container"><p>Личное дело не найдено.</p></main>;
  if (!profileData) return <main className="container"><p>Загрузка...</p></main>;

  const p = profileData;
  const contacts = p.extraContacts || {};

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
		
        <StatusBadges status={p.status} isSquadLeader={p.isSquadLeader} />

        <p><b>Игры:</b> {p.gamesInterested.join(", ")}</p>
        <p><b>Discord ID:</b> {p.discordId}</p>
        <p><b>Steam:</b> <a href={p.steamProfileUrl} target="_blank" rel="noreferrer">{p.steamProfileUrl}</a></p>
        {p.armaId && <p><b>Arma ID:</b> {p.armaId}</p>}
        {p.timezone && <p><b>Часовой пояс:</b> {p.timezone}</p>}
        {p.birthDate && <p><b>Дата рождения:</b> {p.birthDate}</p>}

        {contacts.phone && <p><b>Телефон:</b> {contacts.phone}</p>}
        {contacts.telegram && <p><b>Telegram:</b> {contacts.telegram}</p>}
        {contacts.vk && <p><b>ВКонтакте:</b> {contacts.vk}</p>}
        {contacts.other && <p><b>Другой контакт:</b> {contacts.other}</p>}

        <p><b>Боевые заслуги:</b></p>
        <div className="profile-stats-row">
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
            ? p.awards.map((a, i) => <AwardChip key={i} icon={a.icon} desc={a.desc} />)
            : <span className="hint">Пока нет наград, трудись, боец!</span>}
        </div>

        {isOwn && (
          <Link to="/my-application" className="btn secondary" style={{ marginTop: 16 }}>Редактировать профиль</Link>
        )}
      </div>
    </main>
  );
}
