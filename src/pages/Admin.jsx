import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import StatusBadges from "../components/StatusBadges";
import CommunityStats from "../components/CommunityStats";
import BirthdayReminders from "../components/BirthdayReminders";
import { GAMES, COMPOSITION_RANK, POSITION_RANK, getStatusColor } from "../data/gameRoles";

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

  // Список игроков, у которых вообще есть роль в выбранной игре
  const profilesForGame = useMemo(
    () => players.filter(p => p.gameRoles?.[game]),
    [players, game]
  );

  const pendingCount = useMemo(
    () => profilesForGame.filter(p => p.gameRoles[game].composition === "Отбор").length,
    [profilesForGame, game]
  );

  const filtered = useMemo(() => {
    let list = [...profilesForGame];

    if (tab === "pending") {
      list = list.filter(p => p.gameRoles[game].composition === "Отбор");
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(p => p.callsign.toLowerCase().includes(q));
    }

    list.sort((a, b) => {
      const grA = a.gameRoles[game];
      const grB = b.gameRoles[game];
      if (sortBy === "name") return a.callsign.localeCompare(b.callsign, "ru");
      if (sortBy === "composition") return COMPOSITION_RANK[grA.composition] - COMPOSITION_RANK[grB.composition];
      if (sortBy === "position") return POSITION_RANK[grA.position] - POSITION_RANK[grB.position];
      const aDate = a.createdAt?.seconds || 0;
      const bDate = b.createdAt?.seconds || 0;
      return sortBy === "date-asc" ? aDate - bDate : bDate - aDate;
    });
    return list;
  }, [profilesForGame, tab, search, sortBy, game]);

  function formatDate(ts) {
    if (!ts?.seconds) return "—";
    return new Date(ts.seconds * 1000).toLocaleDateString("ru-RU");
  }

  return (
    <main className="container">
      <h1>Панель комбата</h1>

      <BirthdayReminders profiles={players} />

      <CommunityStats allProfiles={players} game={game} profilesForGame={profilesForGame} />

      <div className="admin-tabs">
        <button className={`tab-btn ${tab === "pending" ? "active" : ""}`} onClick={() => setTab("pending")}>
          Новые заявки {pendingCount > 0 && <span className="tab-badge">{pendingCount}</span>}
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
          <option value="composition">По составу</option>
          <option value="position">По должности</option>
        </select>
        <select value={game} onChange={e => setGame(e.target.value)}>
          {GAMES.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      <div className="table-scroll-wrapper">
        <table>
          <thead>
            <tr><th>Позывной</th><th>Состав</th><th>Должность</th><th>Регистрация</th></tr>
          </thead>
          <tbody>
            {filtered.map(p => {
              const gr = p.gameRoles[game];
              const color = getStatusColor(gr.composition, gr.position);
              return (
                <tr
                  key={p.uid}
                  className="clickable-row"
                  onClick={() => navigate(`/admin/player/${p.uid}`)}
                >
                  <td>
                    <Link to={`/admin/player/${p.uid}`}>{p.callsign}</Link>
                    {gr.isSquadLeader && <span className="badge squad-leader-badge inline-badge">КО</span>}
                  </td>
                  <td><span className="badge" style={{ color, borderColor: color }}>{gr.composition}</span></td>
                  <td><span className="badge" style={{ color, borderColor: color }}>{gr.position}</span></td>
                  <td>{formatDate(p.createdAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>


      {filtered.length === 0 && <p className="hint">Никого не найдено.</p>}
    </main>
  );
}
