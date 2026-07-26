import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "../firebase";
import { collection, query, orderBy, getDocs } from "firebase/firestore";

export default function AdminChangeLog() {
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    async function load() {
      const q = query(collection(db, "changeLog"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setEntries(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }
    load();
  }, []);

  function formatDate(ts) {
    if (!ts?.seconds) return "—";
    return new Date(ts.seconds * 1000).toLocaleString("ru-RU");
  }

  return (
    <main className="container">
      <p><Link to="/admin">← Назад к списку бойцов</Link></p>
      <h1>История изменений</h1>
      <p className="page-lead">Журнал всех изменений, внесённых бойцами в свои личные дела.</p>

      {entries.length === 0 && <p className="hint">Изменений пока не было.</p>}

      {entries.map(entry => (
        <div className="card change-log-entry" key={entry.id}>
          <div className="change-log-header">
            <Link to={`/admin/player/${entry.uid}`}><b>{entry.callsign}</b></Link>
            <span className="change-log-date">{formatDate(entry.createdAt)}</span>
          </div>
          <ul className="change-log-list">
            {entry.changes.map((c, i) => (
              <li key={i}>
                <b>{c.field}:</b> «{c.oldValue}» → «{c.newValue}»
              </li>
            ))}
          </ul>
        </div>
      ))}
    </main>
  );
}
