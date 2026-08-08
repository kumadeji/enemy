import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import StatusBadges from "../components/StatusBadges";
import CommunityStats from "../components/CommunityStats";
import { GAMES, COMPOSITION_RANK, POSITION_RANK, hasRosterAccess, getCompositionColor, getPositionColor } from "../data/gameRoles";

export default function Roster() {
  const { currentUser, isAdmin } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [game, setGame] = useState(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    async function load() {
      const snap = await getDocs(collection(db, "rosterPublic"));
      const list = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
      setProfiles(list);

      // Определяем игру по умолчанию: первая игра, на которую регистрировался
      // текущий пользователь (если залогинен), иначе первая по списку GAMES.
      if (currentUser) {
        const mySnap = list.find(p => p.uid === currentUser.uid);
        if (mySnap?.gamesInterested?.length) {
          setGame(mySnap.gamesInterested[0]);
          return;
        }
      }
      setGame(GAMES[0]);
    }
    load();
  }, [currentUser]);

  const profilesForGame = useMemo(() => {
    if (!game) return [];
    return profiles.filter(p => {
      const gr = p.gameRoles?.[game];
      return gr && gr.composition !== "Отставка"; // скрываем "Отставку" из публичного состава
    });
  }, [profiles, game]);

  const filtered = useMemo(() => {
    let list = [...profilesForGame];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(p => p.callsign.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      const grA = a.gameRoles[game], grB = b.gameRoles[game];
      if (sortBy === "composition") {
        return COMPOSITION_RANK[grA.composition] - COMPOSITION_RANK[grB.composition];
      }
      if (sortBy === "position") {
        return POSITION_RANK[grA.position] - POSITION_RANK[grB.position];
      }
      return a.callsign.localeCompare(b.callsign, "ru");
    });
    return list;
  }, [profilesForGame, search, sortBy, game]);

  if (!game) return <main className="container"><p>Загрузка...</p></main>;

  const canOpenProfiles = isAdmin || hasRosterAccess(profiles.find(p => p.uid === currentUser?.uid)?.gameRoles?.[game]);

  return (
    <main className="container">
      <h1>Состав клана</h1>

      <CommunityStats allProfiles={profiles} game={game} profilesForGame={profilesForGame} />

      <div className="admin-filters card">
        <input type="text" placeholder="Поиск по позывному..." value={search} onChange={e => setSearch(e.target.value)} />
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="name">По имени</option>
          <option value="composition">По составу</option>
          <option value="position">По должности</option>
        </select>
        <select value={game} onChange={e => setGame(e.target.value)}>
          {GAMES.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      {!currentUser && (
        <p className="hint">
          Личные дела бойцов доступны от состава «Запас» и выше.
          {" "}<Link to="/apply">Подать заявку на вступление</Link> или <Link to="/login">войти</Link>.
        </p>
      )}
	  
      <div className="table-scroll-wrapper">
        <table>
          <thead><tr><th>Позывной</th><th>Состав</th><th>Должность</th></tr></thead>
          <tbody>
            {filtered.map(p => {
              const gr = p.gameRoles[game];
			  const compColor = getCompositionColor(gr.composition);
			  const posColor = getPositionColor(gr.position);
              return (
                <tr 
                  key={p.uid} 
                  className={canOpenProfiles ? "clickable-row" : ""}
                  onClick={() => canOpenProfiles && navigate(`/profile/${p.uid}`)}
                >
                  <td>
                    {canOpenProfiles
                      ? <Link to={`/profile/${p.uid}`}>{p.callsign}</Link>
                      : p.callsign}
                    {gr.isSquadLeader && <span className="badge squad-leader-badge inline-badge">КО</span>}
                  </td>
				  <td><span className="badge" style={{ color: compColor, borderColor: compColor }}>{gr.composition}</span></td>
				  <td><span className="badge" style={{ color: posColor, borderColor: posColor }}>{gr.position}</span></td>
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
