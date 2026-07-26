import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import StatusBadges from "../components/StatusBadges";
import CommunityStats from "../components/CommunityStats";

export default function Roster() {
  const [profiles, setProfiles] = useState([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [gameFilter, setGameFilter] = useState("");

  useEffect(() => {
    async function load() {
      const snap = await getDocs(collection(db, "profiles"));
      const list = snap.docs
        .map(d => ({ uid: d.id, ...d.data() }))
        .filter(p => p.status !== "Дезертир"); // дезертиры не отображаются в публичном составе
      setProfiles(list);
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    let list = [...profiles];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(p => p.callsign.toLowerCase().includes(q));
    }
    if (gameFilter) list = list.filter(p => p.gamesInterested?.includes(gameFilter));

    list.sort((a, b) => {
      if (sortBy === "status") return a.status.localeCompare(b.status, "ru");
      return a.callsign.localeCompare(b.callsign, "ru");
    });
    return list;
  }, [profiles, search, sortBy, gameFilter]);

  return (
    <main className="container">
      <h1>Состав клана</h1>

      <CommunityStats profiles={profiles} />

      <div className="admin-filters card">
        <input type="text" placeholder="Поиск по позывному..." value={search} onChange={e => setSearch(e.target.value)} />
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="name">По имени (А-Я)</option>
          <option value="status">По должности</option>
        </select>
        <select value={gameFilter} onChange={e => setGameFilter(e.target.value)}>
          <option value="">Все игры</option>
          <option value="Arma Reforger">Arma Reforger</option>
          <option value="Squad">Squad</option>
        </select>
      </div>

      <table>
        <thead><tr><th>Позывной</th><th>Статус</th><th></th></tr></thead>
        <tbody>
          {filtered.map(p => (
            <tr key={p.uid}>
              <td>{p.callsign}</td>
              <td><StatusBadges status={p.status} isSquadLeader={p.isSquadLeader} /></td>
              <td><Link to={`/profile/${p.uid}`} className="btn secondary">Открыть</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
      {filtered.length === 0 && <p className="hint">Никого не найдено.</p>}
    </main>
  );
}
