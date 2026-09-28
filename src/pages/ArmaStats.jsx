import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, getDocsFromServer, doc, getDoc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { resyncAllRosterPublic } from "../utils/rosterPublic";
import StatsBarChart from "../components/StatsBarChart";

const GAME = "Arma Reforger";

export default function ArmaStats() {
  const { isAdmin } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState("");

  async function loadProfiles(fromServer = false) {
    const snap = fromServer
      ? await getDocsFromServer(collection(db, "rosterPublic"))
      : await getDocs(collection(db, "rosterPublic"));
    setProfiles(snap.docs.map(d => ({ uid: d.id, ...d.data() })));
  }

  async function loadSyncTimestamp() {
    const metaSnap = await getDoc(doc(db, "meta", "statsSync"));
    setLastSyncedAt(metaSnap.exists() ? metaSnap.data().updatedAt : null);
  }

  useEffect(() => {
    loadProfiles();
    loadSyncTimestamp();
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    setRefreshMessage("");
    try {
      if (isAdmin) {
        // Администратор: настоящая пересборка данных из profiles —
        // исправляет рассинхрон после ручных правок в консоли Firebase.
        await resyncAllRosterPublic();
        setRefreshMessage("Статистика пересобрана и обновлена для всех бойцов.");
      } else {
        setRefreshMessage("Показаны самые актуальные опубликованные данные.");
      }
      await loadProfiles(true);
      await loadSyncTimestamp();
    } catch (err) {
      setRefreshMessage("Не удалось обновить: " + err.message);
    } finally {
      setRefreshing(false);
      setTimeout(() => setRefreshMessage(""), 5000);
    }
  }

  function formatSyncDate(ts) {
    if (!ts?.seconds) return "ещё не выполнялась";
    return new Date(ts.seconds * 1000).toLocaleString("ru-RU");
  }

  function buildData(field) {
    return profiles
      .filter(p => (p.gameStats?.[GAME]?.[field] || 0) > 0)
      .map(p => ({ uid: p.uid, callsign: p.callsign, value: p.gameStats[GAME][field] }))
      .sort((a, b) => b.value - a.value);
  }

  return (
    <main className="container">
      <h1>Клановая статистика — Arma Reforger</h1>

      <div className="card">
        <p className="field-hint">
          Последняя пересборка статистики администратором: <b>{formatSyncDate(lastSyncedAt)}</b>.
          {!isAdmin && " Если данные выглядят устаревшими — сообщите об этом администрации."}
        </p>
        <button className="btn secondary" onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? "Обновление..." : "Обновить статистику"}
        </button>
        {refreshMessage && <p className="hint">{refreshMessage}</p>}
      </div>

      <div className="card">
        <h2>Отыграно за бойца</h2>
        <StatsBarChart data={buildData("playedAsSoldierCount")} />
      </div>

      <div className="card">
        <h2>Отыграно за КО</h2>
        <StatsBarChart data={buildData("koCount")} />
      </div>

      <div className="card">
        <h2>Отыграно за КС</h2>
        <StatsBarChart data={buildData("ksCount")} />
      </div>
    </main>
  );
}
