import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import CommunityStats from "../components/CommunityStats";
import BirthdayReminders from "../components/BirthdayReminders";
import { GAMES, COMPOSITION_RANK, POSITION_RANK, getCompositionColor, getPositionColor } from "../data/gameRoles";

export default function Admin() {
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [tab, setTab] = useState("pending");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("date-desc");
  const [game, setGame] = useState(GAMES[0]);

  useEffect(() => {
    async function load() {
      const snap = await getDocs(collection(db, "profiles"));
      setPlayers(snap.docs.map(d => ({ uid: d.id, ...d.data() })));
    }
    load();
  }, []);

  const pendingList = useMemo(() => {
    return players
      .map(p => ({ ...p, pendingGames: Object.entries(p.gameRoles || {}).filter(([, gr]) => gr.composition === "Отбор").map(([g]) => g) }))
      .filter(p => p.pendingGames.length > 0);
  }, [players]);

  const filteredPending = useMemo(() => {
    let list = [...pendingList];
    if (search.trim()) list = list.filter(p => p.callsign.toLowerCase().includes(search.trim().toLowerCase()));
    list.sort((a, b) => {
      if (sortBy === "name") return a.callsign.localeCompare(b.callsign, "ru");
      const aDate = a.createdAt?.seconds || 0, bDate = b.createdAt?.seconds || 0;
      return sortBy === "date-asc" ? aDate - bDate : bDate - aDate;
    });
    return list;
  }, [pendingList, search, sortBy]);

  const profilesForGame = useMemo(() => players.filter(p => p.gameRoles?.[game]), [players, game]);

  const filteredAll = useMemo(() => {
    let list = [...profilesForGame];
    if (search.trim()) list = list.filter(p => p.callsign.toLowerCase().includes(search.trim().toLowerCase()));
    list.sort((a, b) => {
      const grA = a.gameRoles[game], grB = b.gameRoles[game];
      if (sortBy === "name") return a.callsign.localeCompare(b.callsign, "ru");
      if (sortBy === "composition") return COMPOSITION_RANK[grA.composition] - COMPOSITION_RANK[grB.composition];
      if (sortBy === "position") return POSITION_RANK[grA.position] - POSITION_RANK[grB.position];
      const aDate = a.createdAt?.seconds || 0, bDate = b.createdAt?.seconds || 0;
      return sortBy === "date-asc" ? aDate - bDate : bDate - aDate;
    });
    return list;
  }, [profilesForGame, search, sortBy, game]);

  function formatDate(ts) { return ts?.seconds ? new Date(ts.seconds * 1000).toLocaleDateString("ru-RU") : "—"; }

  return (
    <main className="container">
      <h1>Панель комбата</h1>
      <BirthdayReminders profiles={players} />

      {tab === "pending" ? (
        <div className="card pending-stats-card">
          <span className="stat-value">{pendingList.length}</span>
          <span className="stat-label">заявок на рассмотрении (по всем играм)</span>
        </div>
      ) : (
        <CommunityStats allProfiles={players} game={game} profilesForGame={profilesForGame} />
      )}

      <div className="admin-tabs">
        <button className={`tab-btn ${tab === "pending" ? "active" : ""}`} onClick={() => setTab("pending")}>
          Новые заявки {pendingList.length > 0 && <span className="tab-badge">{pendingList.length}</span>}
        </button>
        <button className={`tab-btn ${tab === "all" ? "active" : ""}`} onClick={() => setTab("all")}>Все бойцы</button>
        <Link to="/admin/changelog" className="changelog-nav-link">Журнал изменений</Link>
      </div>

      <div className="admin-filters card">
        <input type="text" placeholder="Поиск по позывному..." value={search} onChange={e => setSearch(e.target.value)} />
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="date-desc">Сначала новые</option>
          <option value="date-asc">Сначала старые</option>
          <option value="name">По позывному</option>
          {tab === "all" && <option value="composition">По составу</option>}
          {tab === "all" && <option value="position">По должности</option>}
        </select>
        {tab === "all" && (
          <select value={game} onChange={e => setGame(e.target.value)}>
            {GAMES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        )}
      </div>

      <div className="table-scroll-wrapper">
        {tab === "pending" ? (
          <table>
            <thead><tr><th>Позывной</th><th>Игры</th><th>Регистрация</th></tr></thead>
            <tbody>
              {filteredPending.map(p => (
                <tr key={p.uid} className="clickable-row" onClick={() => navigate(`/admin/player/${p.uid}`)}>
                  <td><Link to={`/admin/player/${p.uid}`}>{p.callsign}</Link></td>
                  <td>{p.pendingGames.join(", ")}</td>
                  <td>{formatDate(p.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table>
            <thead><tr><th>Позывной</th><th>Состав</th><th>Должность</th><th>Регистрация</th></tr></thead>
            <tbody>
              {filteredAll.map(p => {
                const gr = p.gameRoles[game];
                const compColor = getCompositionColor(gr.composition), posColor = getPositionColor(gr.position);
                return (
                  <tr key={p.uid} className="clickable-row" onClick={() => navigate(`/admin/player/${p.uid}`)}>
                    <td><Link to={`/admin/player/${p.uid}`}>{p.callsign}</Link>{gr.isSquadLeader && <span className="badge squad-leader-badge inline-badge">КО</span>}</td>
                    <td><span className="badge" style={{ color: compColor, borderColor: compColor }}>{gr.composition}</span></td>
                    <td><span className="badge" style={{ color: posColor, borderColor: posColor }}>{gr.position}</span></td>
                    <td>{formatDate(p.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
