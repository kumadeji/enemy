import { useEffect, useState } from "react";
import { db, STATUS_ORDER } from "../firebase";
import { collection, getDocs, doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";

export default function Admin() {
  const [entries, setEntries] = useState([]);

  async function loadAll() {
    const profilesSnap = await getDocs(collection(db, "profiles"));
    const list = [];
    for (const d of profilesSnap.docs) {
      const uid = d.id;
      const p = d.data();
      const appSnap = await getDoc(doc(db, "applications", uid));
      const a = appSnap.exists() ? appSnap.data() : {};
      list.push({ uid, profile: p, application: a });
    }
    setEntries(list);
  }

  useEffect(() => { loadAll(); }, []);

  async function changeStatus(uid, status) {
    await updateDoc(doc(db, "profiles", uid), { status });
    setEntries(prev => prev.map(e => e.uid === uid ? { ...e, profile: { ...e.profile, status } } : e));
  }

  async function giveAward(uid, icon, desc) {
    if (!icon || !desc) return;
    const entry = entries.find(e => e.uid === uid);
    const awards = [...(entry.profile.awards || []), { icon, desc }];
    await updateDoc(doc(db, "profiles", uid), { awards });
    setEntries(prev => prev.map(e => e.uid === uid ? { ...e, profile: { ...e.profile, awards } } : e));
  }

  async function deleteUser(uid) {
    if (!confirm("Точно удалить пользователя?")) return;
    await deleteDoc(doc(db, "profiles", uid));
    await deleteDoc(doc(db, "applications", uid));
    setEntries(prev => prev.filter(e => e.uid !== uid));
  }

  return (
    <main className="container">
      <h1>Панель администратора</h1>
      {entries.map(({ uid, profile: p, application: a }) => (
        <AdminCard key={uid} uid={uid} p={p} a={a}
          onStatusChange={changeStatus} onGiveAward={giveAward} onDelete={deleteUser} />
      ))}
    </main>
  );
}

function AdminCard({ uid, p, a, onStatusChange, onGiveAward, onDelete }) {
  const [icon, setIcon] = useState("");
  const [desc, setDesc] = useState("");

  return (
    <div className="card">
      <h2>{p.callsign}</h2>
      <p><b>Email:</b> {a.email || "—"}</p>
      <p><b>Имя:</b> {a.fullName || "—"}, <b>возраст:</b> {a.age || "—"}</p>
      <p><b>Steam:</b> {a.steamUrl || "—"}</p>
      <p><b>Часовой пояс:</b> {a.timezone || "—"}</p>
      <p><b>Доступность:</b> {a.availability || "—"}</p>
      <p><b>Почему хочет вступить:</b> {a.whyJoin || "—"}</p>
      <p><b>Откуда узнал:</b> {a.howFound || "—"}</p>
      <p><b>Устав принят:</b> {a.charterAgreed ? "да" : "нет"}</p>

      <label>Статус</label>
      <select value={p.status} onChange={e => onStatusChange(uid, e.target.value)}>
        {STATUS_ORDER.map(s => <option key={s} value={s}>{s}</option>)}
      </select>

      <label>Выдать награду (иконка emoji)</label>
      <input type="text" placeholder="🏅" value={icon} onChange={e => setIcon(e.target.value)} />
      <label>Описание награды</label>
      <input type="text" placeholder="За отвагу в бою" value={desc} onChange={e => setDesc(e.target.value)} />
      <button className="btn secondary" onClick={() => { onGiveAward(uid, icon, desc); setIcon(""); setDesc(""); }}>Выдать награду</button>

      <button className="btn danger" onClick={() => onDelete(uid)}>Удалить пользователя</button>
    </div>
  );
}
