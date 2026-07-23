import { useEffect, useState } from "react";
import { db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";

export default function Queue() {
  const { isAdmin } = useAuth();
  const [current, setCurrent] = useState([]);
  const [newCallsign, setNewCallsign] = useState("");

  async function loadQueue() {
    const snap = await getDoc(doc(db, "queue", "state"));
    const data = snap.exists() ? snap.data() : { current: [] };
    setCurrent(data.current || []);
  }

  useEffect(() => { loadQueue(); }, []);

  async function saveQueue(newCurrent) {
    await setDoc(doc(db, "queue", "state"), { current: newCurrent });
    setCurrent(newCurrent);
  }

  function addToQueue() {
    if (!newCallsign.trim()) return;
    saveQueue([...current, { callsign: newCallsign.trim() }]);
    setNewCallsign("");
  }

  function markPlayed() {
    if (current.length === 0) return;
    const [first, ...rest] = current;
    saveQueue([...rest, first]);
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

      <h2>Текущая очередь</h2>
      <ol className="card" style={{ listStyle: "none", padding: 16 }}>
        {current.map((item, i) => (
          <li key={i} className={`queue-item ${i === 0 ? "next" : ""}`}>
            <span className="queue-pos">{i + 1}</span> {item.callsign}
            {i === 0 && <span className="badge">Следующий КО</span>}
          </li>
        ))}
      </ol>

      {isAdmin && (
        <div className="card">
          <h2>Управление очередью (админ)</h2>
          <input type="text" placeholder="Позывной" value={newCallsign} onChange={e => setNewCallsign(e.target.value)} />
          <button className="btn" onClick={addToQueue}>Добавить в конец очереди</button>
          <button className="btn" onClick={markPlayed}>Отметить первого как отыгравшего</button>
        </div>
      )}
    </main>
  );
}
