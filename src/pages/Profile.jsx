import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { uid } = useParams();
  const { currentUser, profile: myProfile } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [notFound, setNotFound] = useState(false);

  const targetUid = uid || currentUser?.uid;
  const isOwn = targetUid === currentUser?.uid;

  useEffect(() => {
    async function load() {
      if (isOwn && myProfile) { setProfileData(myProfile); return; }
      const snap = await getDoc(doc(db, "profiles", targetUid));
      if (snap.exists()) setProfileData(snap.data());
      else setNotFound(true);
    }
    load();
  }, [targetUid, isOwn, myProfile]);

  if (notFound) return <main className="container"><p>Профиль не найден.</p></main>;
  if (!profileData) return <main className="container"><p>Загрузка...</p></main>;

  const p = profileData;
  const contacts = p.extraContacts || {};
  const hasExtra = contacts.phone || contacts.telegram || contacts.vk || contacts.other;

  return (
    <main className="container">
      <h1>Профиль бойца</h1>
      <div className="card">
        <h2>{p.callsign} {p.isSquadLeader && <span className="badge squad-leader-badge">Командир отряда</span>}</h2>
        <span className="badge" data-status={p.status}>{p.status}</span>

        <p><b>Игры:</b> {p.gamesInterested.join(", ")}</p>
        <p><b>Discord ID:</b> {p.discordId}</p>
        <p><b>Steam:</b> <a href={p.steamProfileUrl} target="_blank" rel="noreferrer">{p.steamProfileUrl}</a></p>
        {p.armaId && <p><b>Arma ID:</b> {p.armaId}</p>}
        {p.timezone && <p><b>Часовой пояс:</b> {p.timezone}</p>}
        {hasExtra && (
          <p><b>Доп. контакты:</b> {[contacts.phone, contacts.telegram, contacts.vk, contacts.other].filter(Boolean).join(" / ")}</p>
        )}

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
