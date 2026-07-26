import { useEffect, useMemo, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc, setDoc, runTransaction, collection, getDocs } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";

export default function Queue() {
  const { isAdmin } = useAuth();
  const [queue, setQueue] = useState([]);
  const [profilesMap, setProfilesMap] = useState({});
  const [squadLeaders, setSquadLeaders] = useState([]);
  const [selectedToAdd, setSelectedToAdd] = useState("");

  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  async function loadAll() {
    const qSnap = await getDoc(doc(db, "queue", "state"));
    const current = qSnap.exists() ? (qSnap.data().current || []) : [];
    setQueue(current);

    const profilesSnap = await getDocs(collection(db, "profiles"));
    const map = {};
    const leaders = [];
    profilesSnap.docs.forEach(d => {
      const data = { uid: d.id, ...d.data() };
      map[d.id] = data;
      if (data.isSquadLeader) leaders.push(data);
    });
    setProfilesMap(map);
    setSquadLeaders(leaders);
  }

  useEffect(() => { loadAll(); }, []);

  const availableToAdd = useMemo(
    () => squadLeaders.filter(l => !queue.some(q => q.uid === l.uid)),
    [squadLeaders, queue]
  );

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

  async function markPlayed() {
    if (queue.length === 0) return;
    const firstUid = queue[0].uid;
    await runTransaction(db, async (tx) => {
      const profileRef = doc(db, "profiles", firstUid);
      const profileSnap = await tx.get(profileRef);
      const koCount = (profileSnap.data()?.koCount || 0) + 1;
      tx.update(profileRef, { koCount });

      const queueRef = doc(db, "queue", "state");
      const rest = queue.slice(1);
      tx.set(queueRef, { current: [...rest, { uid: firstUid }] });
    });
    setProfilesMap(prev => ({
      ...prev,
      [firstUid]: { ...prev[firstUid], koCount: (prev[firstUid]?.koCount || 0) + 1 }
    }));
    setQueue([...queue.slice(1), { uid: firstUid }]);
  }

  return (
    <main className="container">
      <h1>Очередь на командира отряда (КО)</h1>

      <details className="card">
        <summary>Правила очереди</summary>
        <ul>
          <li>Если игрок из очереди пришёл на игру и его очередь подошла — он занимает позицию КО.</li>
          <li>Если не смог — позицию занимает следующий пришедший по договорённости.</li>
          <li>Отложить командование можно только по уважительной причине.</li>
          <li>Не смог/не пришёл (в т.ч. не записывался) — остаётся первым в очереди на следующий раз.</li>
          <li>Отыграл за КО — уходит в конец очереди.</li>
        </ul>
      </details>

      <div className="card queue-card">
        {queue.length === 0 && <p className="hint">Очередь пуста. Добавьте участников со статусом «Командир отряда».</p>}
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
                <Link to={`/profile/${p.uid}`} className="queue-callsign">{p.callsign}</Link>
                <span className="queue-ko-count">КО: {p.koCount || 0}</span>
                {index === 0 && <span className="badge">Следующий КО</span>}
                {isAdmin && (
                  <span className="queue-actions">
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

      {isAdmin && (
        <div className="card">
          <h2>Управление очередью</h2>
          <label>Добавить командира отряда в очередь</label>
          <select value={selectedToAdd} onChange={e => setSelectedToAdd(e.target.value)}>
            <option value="">Выберите игрока...</option>
            {availableToAdd.map(l => <option key={l.uid} value={l.uid}>{l.callsign}</option>)}
          </select>
          <button className="btn secondary" onClick={addToQueue}>Добавить в конец очереди</button>
          <button className="btn" onClick={markPlayed}>Отметить первого как отыгравшего</button>
          <div className="field-hint">
            Роль «Командир отряда» присваивается через панель администратора в профиле игрока.
            Порядок можно менять перетаскиванием (на ПК) или стрелками ↑/↓ (на любом устройстве).
          </div>
        </div>
      )}
    </main>
  );
}
