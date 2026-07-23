import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

export default function Roster() {
  const [profiles, setProfiles] = useState([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    async function load() {
      const snap = await getDocs(collection(db, "profiles"));
      const list = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
      list.sort((a, b) => a.callsign.localeCompare(b.callsign, "ru"));
      setProfiles(list);
    }
    load();
  }, []);

  const filtered = profiles.filter(p => !filter || p.gamesInterested.includes(filter));

  return (
    <main className="container">
      <h1>Состав клана</h1>
      <label>Фильтр по игре</label>
      <select value={filter} onChange={e => setFilter(e.target.value)}>
        <option value="">Все</option>
        <option value="Arma Reforger">Arma Reforger</option>
        <option value="Squad">Squad</option>
      </select>
      <table>
        <thead><tr><th>Позывной</th><th>Статус</th></tr></thead>
        <tbody>
          {filtered.map(p => (
            <tr key={p.uid}>
              <td><Link to={`/profile/${p.uid}`}>{p.callsign}</Link></td>
              <td><span className="badge" data-status={p.status}>{p.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
