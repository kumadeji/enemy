import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { db, STATUS_ORDER } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

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
      if (sortBy === "status") return STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
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
      <h1>Панель администратора</h1>

      <div className="admin-stats card">
        <div><span className="stat-value">{stats.total}</span><span className="stat-label">всего участников</span></div>
        <div><span className="stat-value">{stats.pending}</span><span className="stat-label">заявок на рассмотрении</span></div>
        {STATUS_ORDER.map(s => (
          <div key={s}><span className="stat-value">{stats.byStatus[s] || 0}</span><span className="stat-label">{s}</span></div>
        ))}
      </div>

      <div className="admin-tabs">
        <button className={`tab-btn ${tab === "pending" ? "active" : ""}`} onClick={() => setTab("pending")}>
          Новые заявки {stats.pending > 0 && <span className="tab-badge">{stats.pending}</span>}
        </button>
        <button className={`tab-btn ${tab === "all" ? "active" : ""}`} onClick={() => setTab("all")}>Все участники</button>
      </div>

      <div className="admin-filters card">
        <input type="text" placeholder="Поиск по позывному..." value={search} onChange={e => setSearch(e.target.value)} />
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="date-desc">Сначала новые</option>
          <option value="date-asc">Сначала старые</option>
          <option value="name">По имени (А-Я)</option>
          <option value="status">По статусу</option>
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
              <td>{p.callsign} {p.isSquadLeader && <span className="badge">КО</span>}</td>
              <td><span className="badge" data-status={p.status}>{p.status}</span></td>
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
