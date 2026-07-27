import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { db, STATUS_ORDER } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import StatusBadges from "../components/StatusBadges";
import CommunityStats from "../components/CommunityStats";
import { STATUS_SORT_ORDER } from "../data/statusSortOrder";

export default function Admin() {
  const [players, setPlayers] = useState([]);
  const [tab, setTab] = useState("pending");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("date-desc");
  const [gameFilter, setGameFilter] = useState("");

  useEffect(() => {
    async function load() {
      const snap = await getDocs(collection(db, "profiles"));
      setPlayers(snap.docs.map(d => ({ uid: d.id, ...d.data() })));
    }
    load();
  }, []);

  const stats = useMemo(() => {
    const total = players.length;
    const pending = players.filter(p => p.status === "Новобранец").length;
    const byStatus = STATUS_ORDER.reduce((acc, s) => {
      acc[s] = players.filter(p => p.status === s).length;
      return acc;
    }, {});
    return { total, pending, byStatus };
  }, [players]);

  const filtered = useMemo(() => {
    let list = [...players];
    if (tab === "pending") list = list.filter(p => p.status === "Новобранец");
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(p => p.callsign.toLowerCase().includes(q));
    }
    if (gameFilter) list = list.filter(p => p.gamesInterested?.includes(gameFilter));

    list.sort((a, b) => {
      if (sortBy === "name") return a.callsign.localeCompare(b.callsign, "ru");
      if (sortBy === "status") return STATUS_SORT_ORDER.indexOf(a.status) - STATUS_SORT_ORDER.indexOf(b.status);
      const aDate = a.createdAt?.seconds || 0;
      const bDate = b.createdAt?.seconds || 0;
      return sortBy === "date-asc" ? aDate - bDate : bDate - aDate;
    });
    return list;
  }, [players, tab, search, sortBy, gameFilter]);

  function formatDate(ts) {
    if (!ts?.seconds) return "—";
    return new Date(ts.seconds * 1000).toLocaleDateString("ru-RU");
  }

  return (
    <main className="container">
      <h1>Панель комбата</h1>

      <CommunityStats profiles={players} />

      <div className="admin-tabs">
        <button className={`tab-btn ${tab === "pending" ? "active" : ""}`} onClick={() => setTab("pending")}>
          Новые заявки {stats.pending > 0 && <span className="tab-badge">{stats.pending}</span>}
        </button>
        <button className={`tab-btn ${tab === "all" ? "active" : ""}`} onClick={() => setTab("all")}>Все бойцы</button>
        <Link to="/admin/changelog" className="changelog-nav-link">Журнал изменений</Link>
      </div>


      <div className="admin-filters card">
        <input type="text" placeholder="Поиск по позывному..." value={search} onChange={e => setSearch(e.target.value)} />
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="date-desc">Сначала новые</option>
          <option value="date-asc">Сначала старые</option>
          <option value="name">По имени</option>
          <option value="status">По должности</option>
        </select>
        <select value={gameFilter} onChange={e => setGameFilter(e.target.value)}>
          <option value="">Все игры</option>
          <option value="Arma Reforger">Arma Reforger</option>
          <option value="Squad">Squad</option>
        </select>
      </div>

      <table>
        <thead>
          <tr><th>Позывной</th><th>Статус</th><th>Игры</th><th>Регистрация</th><th></th></tr>
        </thead>
        <tbody>
          {filtered.map(p => (
            <tr key={p.uid}>
              <td>{p.callsign}</td>
              <td><StatusBadges status={p.status} isSquadLeader={p.isSquadLeader} /></td>
              <td>{p.gamesInterested?.join(", ")}</td>
              <td>{formatDate(p.createdAt)}</td>
              <td><Link to={`/admin/player/${p.uid}`} className="btn secondary">Открыть</Link></td>
            </tr>
          ))}
        </tbody>
      </table>

      {filtered.length === 0 && <p className="hint">Никого не найдено.</p>}
    </main>
  );
}
