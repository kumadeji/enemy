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
      if (isOwn && myProfile) {
        setProfileData(myProfile);
        return;
      }
      const snap = await getDoc(doc(db, "profiles", targetUid));
      if (snap.exists()) setProfileData(snap.data());
      else setNotFound(true);
    }
    load();
  }, [targetUid, isOwn, myProfile]);

  if (notFound) return <main className="container"><p>Профиль не найден.</p></main>;
  if (!profileData) return <main className="container"><p>Загрузка...</p></main>;

  const p = profileData;

  return (
    <main className="container">
      <h1>Профиль бойца</h1>
      <div className="card">
        <h2>{p.callsign}</h2>
        <span className="badge" data-status={p.status}>{p.status}</span>
        <p><b>Игры:</b> {p.gamesInterested.join(", ")}</p>
        <p><b>Discord:</b> {p.discordTag}</p>
        <p><b>Steam:</b> <a href={p.steamUrl} target="_blank" rel="noreferrer">{p.steamUrl}</a></p>
        {p.extraContacts && <p><b>Доп. контакты:</b> {p.extraContacts}</p>}
        <p><b>Награды:</b> {
          (p.awards || []).length
            ? p.awards.map((a, i) => <span key={i} className="award-icon" title={a.desc}>{a.icon}</span>)
            : "пока нет"
        }</p>
      </div>
    </main>
  );
}
