import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import StatusBadges from "../components/StatusBadges";
import CommunityStats from "../components/CommunityStats";
import { STATUS_SORT_ORDER } from "../data/statusSortOrder";

export default function Roster() {
  const { currentUser, profile: myProfile, isAdmin } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [gameFilter, setGameFilter] = useState("");

  useEffect(() => {
    async function load() {
      // Публичная коллекция — доступна без авторизации, содержит только
      // безопасные для публикации поля (без контактов, дат рождения и т.п.)
      const snap = await getDocs(collection(db, "rosterPublic"));
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
      if (sortBy === "status") return STATUS_SORT_ORDER.indexOf(a.status) - STATUS_SORT_ORDER.indexOf(b.status);
      return a.callsign.localeCompare(b.callsign, "ru");
    });
    return list;
  }, [profiles, search, sortBy, gameFilter]);

  // Может ли текущий пользователь открывать отдельные профили
  const allowedToOpenProfiles = ["Боец запаса", "Боец личного состава", "Комбат", "Заместитель комбата"];
  const canOpenProfiles = isAdmin || (myProfile && allowedToOpenProfiles.includes(myProfile.status));

  return (
    <main className="container">
      <h1>Состав клана</h1>

      <CommunityStats profiles={profiles} />

      <div className="admin-filters card">
        <input type="text" placeholder="Поиск по позывному..." value={search} onChange={e => setSearch(e.target.value)} />
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="name">По позывному</option>
          <option value="status">По должности</option>
        </select>
        <select value={gameFilter} onChange={e => setGameFilter(e.target.value)}>
          <option value="">Все игры</option>
          <option value="Arma Reforger">Arma Reforger</option>
          <option value="Squad">Squad</option>
        </select>
      </div>

      {!currentUser && (
        <p className="hint">
          Личные дела бойцов доступны для ознакомления, начиная с должности «Боец запаса» и выше.
          {" "}<Link to="/apply">Подать заявку на вступление</Link> или <Link to="/login">войти</Link>.
        </p>
      )}

      <table>
        <thead><tr><th>Позывной</th><th>Должность</th><th></th></tr></thead>
        <tbody>
          {filtered.map(p => (
            <tr key={p.uid}>
              <td>{p.callsign}</td>
              <td><StatusBadges status={p.status} isSquadLeader={p.isSquadLeader} /></td>
              <td>
                {canOpenProfiles
                  ? <Link to={`/profile/${p.uid}`} className="btn secondary">Открыть</Link>
                  : <span className="hint">Нет доступа</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {filtered.length === 0 && <p className="hint">Никого не найдено.</p>}
    </main>
  );
}
