import { useEffect, useMemo, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc, setDoc, updateDoc, runTransaction, collection, getDocs } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import KoStatsChart from "../components/KoStatsChart";

// Очередь на КО ведётся строго по направлению Arma Reforger
const QUEUE_GAME = "Arma Reforger";

export default function Queue() {
  const { currentUser, isAdmin } = useAuth();
  const [queue, setQueue] = useState([]);
  const [profilesMap, setProfilesMap] = useState({});
  const [selectedToAdd, setSelectedToAdd] = useState("");
  const [selectedToPromote, setSelectedToPromote] = useState("");

  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  async function loadAll() {
    const qSnap = await getDoc(doc(db, "queue", "state"));
    const current = qSnap.exists() ? (qSnap.data().current || []) : [];
    setQueue(current);

    // Публичная коллекция — доступна без авторизации
    const rosterSnap = await getDocs(collection(db, "rosterPublic"));
    const map = {};
    rosterSnap.docs.forEach(d => { map[d.id] = { uid: d.id, ...d.data() }; });
    setProfilesMap(map);
  }

  useEffect(() => { loadAll(); }, []);

  // Является ли игрок "Командиром отделения" именно в Arma Reforger
  function isSquadLeaderInQueueGame(p) {
    return !!p.gameRoles?.[QUEUE_GAME]?.isSquadLeader;
  }

  const squadLeaders = useMemo(
    () => Object.values(profilesMap).filter(isSquadLeaderInQueueGame),
    [profilesMap]
  );
  const nonLeaders = useMemo(
    () => Object.values(profilesMap).filter(p => p.gameRoles?.[QUEUE_GAME] && !isSquadLeaderInQueueGame(p)),
    [profilesMap]
  );
  const availableToAdd = useMemo(
    () => squadLeaders.filter(l => !queue.some(q => q.uid === l.uid)),
    [squadLeaders, queue]
  );

  const statsData = useMemo(() => {
    const list = Object.values(profilesMap).filter(p => (p.koCount || 0) > 0 || isSquadLeaderInQueueGame(p));
    return [...list].sort((a, b) => (b.koCount || 0) - (a.koCount || 0));
  }, [profilesMap]);

  async function saveQueue(newQueue) {
    await setDoc(doc(db, "queue", "state"), { current: newQueue });
    setQueue(newQueue);
  }

  function addToQueue() {
    if (!selectedToAdd) return;
    saveQueue([...queue, { uid: selectedToAdd }]);
    setSelectedToAdd("");
  }

  function removeFromQueue(uid) {
    saveQueue(queue.filter(q => q.uid !== uid));
  }

  function moveUp(index) {
    if (index === 0) return;
    const newQueue = [...queue];
    [newQueue[index - 1], newQueue[index]] = [newQueue[index], newQueue[index - 1]];
    saveQueue(newQueue);
  }

  function moveDown(index) {
    if (index === queue.length - 1) return;
    const newQueue = [...queue];
    [newQueue[index + 1], newQueue[index]] = [newQueue[index], newQueue[index + 1]];
    saveQueue(newQueue);
  }

  function handleDragStart(index) { dragItem.current = index; }
  function handleDragEnter(index) { dragOverItem.current = index; }
  function handleDragEnd() {
    if (dragItem.current === null || dragOverItem.current === null) return;
    const newQueue = [...queue];
    const [moved] = newQueue.splice(dragItem.current, 1);
    newQueue.splice(dragOverItem.current, 0, moved);
    dragItem.current = null;
    dragOverItem.current = null;
    saveQueue(newQueue);
  }

  async function markPlayed(uid) {
    await runTransaction(db, async (tx) => {
      const profileRef = doc(db, "profiles", uid);
      const rosterRef = doc(db, "rosterPublic", uid);
      const profileSnap = await tx.get(profileRef);
      const koCount = (profileSnap.data()?.koCount || 0) + 1;

      tx.update(profileRef, { koCount });
      tx.update(rosterRef, { koCount });

      const queueRef = doc(db, "queue", "state");
      const newQueue = [...queue.filter(q => q.uid !== uid), { uid }];
      tx.set(queueRef, { current: newQueue });
    });
    setProfilesMap(prev => ({ ...prev, [uid]: { ...prev[uid], koCount: (prev[uid]?.koCount || 0) + 1 } }));
    setQueue(prev => [...prev.filter(q => q.uid !== uid), { uid }]);
  }

  async function promoteToSquadLeader() {
    if (!selectedToPromote) return;
    const target = profilesMap[selectedToPromote];
    const currentRole = target.gameRoles?.[QUEUE_GAME] || {};
    const updatedRole = { ...currentRole, isSquadLeader: true };
    const updatedGameRoles = { ...target.gameRoles, [QUEUE_GAME]: updatedRole };

    await updateDoc(doc(db, "profiles", selectedToPromote), { gameRoles: updatedGameRoles });
    await updateDoc(doc(db, "rosterPublic", selectedToPromote), { gameRoles: updatedGameRoles });

    setProfilesMap(prev => ({ ...prev, [selectedToPromote]: { ...prev[selectedToPromote], gameRoles: updatedGameRoles } }));
    setSelectedToPromote("");
  }

  return (
    <main className="container">
      <h1>Очередь на командира отделения (КО)</h1>

      <details className="card queue-rules">
        <summary>Правила очереди</summary>
        <ul>
          <li>Если игрок из очереди пришёл на игру и его очередь подошла — он становится КО.</li>
          <li>Если не смог — позицию занимает следующий пришедший, но по договорённости.</li>
          <li>Отложить командование можно только по уважительной причине.</li>
          <li>Если не смог и не пришёл (в т.ч. не записывался) — остаётся первым в очереди на следующий раз.</li>
          <li>Отыграл за КО — уходит в конец очереди.</li>
        </ul>
      </details>

      <div className="card queue-card">
        {queue.length === 0 && <p className="hint">Очередь пуста. Добавьте бойцов с должностью «Командир отделения».</p>}
        <ol className="queue-ordered-list">
          {queue.map((item, index) => {
            const p = profilesMap[item.uid];
            if (!p) return null;
            return (
              <li
                key={item.uid}
                className={`queue-item ${index === 0 ? "next" : ""}`}
                draggable={isAdmin}
                onDragStart={() => handleDragStart(index)}
                onDragEnter={() => handleDragEnter(index)}
                onDragEnd={handleDragEnd}
                onDragOver={e => e.preventDefault()}
              >
                {isAdmin && <span className="drag-handle">⠿</span>}
                <span className="queue-pos">{index + 1}</span>
                {currentUser
                  ? <Link to={`/profile/${p.uid}`} className="queue-callsign queue-callsign-link">{p.callsign}</Link>
                  : <span className="queue-callsign">{p.callsign}</span>}
                {index === 0 && <span className="badge">Следующий КО</span>}
                {isAdmin && (
                  <span className="queue-actions">
                    <button className="btn-mini" onClick={() => markPlayed(item.uid)}>Отыграл за КО</button>
                    <button className="icon-btn" onClick={() => moveUp(index)} title="Выше">↑</button>
                    <button className="icon-btn" onClick={() => moveDown(index)} title="Ниже">↓</button>
                    <button className="icon-btn danger" onClick={() => removeFromQueue(item.uid)} title="Убрать из очереди">✕</button>
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </div>

      <div className="card">
        <h2>Статистика отыгрышей за КО</h2>
        {statsData.length === 0 && <p className="hint">Пока нет данных статистики.</p>}
        <KoStatsChart data={statsData} />
        <p className="stats-since-note">Статистика игр за КО ведётся с 25 июля 2026 года.</p>
      </div>

      {isAdmin && (
        <div className="card">
          <h2>Управление очередью</h2>
          <label>Добавить командира отделения в очередь</label>
          <select value={selectedToAdd} onChange={e => setSelectedToAdd(e.target.value)}>
            <option value="">Выберите бойца...</option>
            {availableToAdd.map(l => <option key={l.uid} value={l.uid}>{l.callsign}</option>)}
          </select>
          <button className="btn secondary" onClick={addToQueue}>Добавить в конец очереди</button>

          <label style={{ marginTop: 16 }}>Назначить нового командира отделения</label>
          <select value={selectedToPromote} onChange={e => setSelectedToPromote(e.target.value)}>
            <option value="">Выберите бойца...</option>
            {nonLeaders.map(p => <option key={p.uid} value={p.uid}>{p.callsign}</option>)}
          </select>
          <button className="btn secondary" onClick={promoteToSquadLeader}>Назначить командиром отделения</button>
        </div>
      )}

    </main>
  );
}
