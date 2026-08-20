import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import StatsBarChart from "../components/StatsBarChart";

const GAME = "Arma Reforger";

export default function ArmaStats() {
  const [profiles, setProfiles] = useState([]);

  useEffect(() => {
    async function load() {
      const snap = await getDocs(collection(db, "rosterPublic"));
      setProfiles(snap.docs.map(d => ({ uid: d.id, ...d.data() })));
    }
    load();
  }, []);

  function buildData(field) {
    return profiles
      .filter(p => (p.gameStats?.[GAME]?.[field] || 0) > 0)
      .map(p => ({ uid: p.uid, callsign: p.callsign, value: p.gameStats[GAME][field] }))
      .sort((a, b) => b.value - a.value);
  }

  return (
    <main className="container">
      <h1>Статистика отыгрышей — Arma Reforger</h1>

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
