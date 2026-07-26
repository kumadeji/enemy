import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import StatusBadges from "../components/StatusBadges";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { uid } = useParams();
  const { currentUser } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [notFound, setNotFound] = useState(false);

  const targetUid = uid || currentUser?.uid;

  useEffect(() => {
    async function load() {
      setProfileData(null);
      const snap = await getDoc(doc(db, "profiles", targetUid));
      if (snap.exists()) setProfileData(snap.data());
      else setNotFound(true);
    }
    if (targetUid) load();
  }, [targetUid]);

  if (notFound) return <main className="container"><p>Профиль не найден.</p></main>;
  if (!profileData) return <main className="container"><p>Загрузка...</p></main>;

  const p = profileData;
  const contacts = p.extraContacts || {};

  return (
    <main className="container">
      <h1>Профиль бойца</h1>
      <div className="card">
        <h2>{p.callsign}</h2>
        <StatusBadges status={p.status} isSquadLeader={p.isSquadLeader} />

        <p><b>Игры:</b> {p.gamesInterested.join(", ")}</p>
        <p><b>Discord ID:</b> {p.discordId}</p>
        <p><b>Steam:</b> <a href={p.steamProfileUrl} target="_blank" rel="noreferrer">{p.steamProfileUrl}</a></p>
        {p.armaId && <p><b>Arma ID:</b> {p.armaId}</p>}
        {p.timezone && <p><b>Часовой пояс:</b> {p.timezone}</p>}

        {contacts.phone && <p><b>Телефон:</b> {contacts.phone}</p>}
        {contacts.telegram && <p><b>Telegram:</b> {contacts.telegram}</p>}
        {contacts.vk && <p><b>ВКонтакте:</b> {contacts.vk}</p>}
        {contacts.other && <p><b>Другой контакт:</b> {contacts.other}</p>}

        <div className="stats-row">
          <div><span className="stat-value">{p.koCount || 0}</span><span className="stat-label">раз КО</span></div>
          <div><span className="stat-value">{p.ksCount || 0}</span><span className="stat-label">раз КС</span></div>
        </div>

        <p><b>Награды:</b> {
          (p.awards || []).length
            ? p.awards.map((a, i) => <span key={i} className="award-icon" title={a.desc}>{a.icon}</span>)
            : "пока нет"
        }</p>

        {p.publicNote && (
          <div className="public-note-box">
            <b>Заметка от администрации:</b> {p.publicNote}
          </div>
        )}
      </div>
    </main>
  );
}
