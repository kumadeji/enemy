import { useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, doc, updateDoc, setDoc } from "firebase/firestore";

export default function AdminMigrate() {
  const [log, setLog] = useState([]);
  const [running, setRunning] = useState(false);

  function addLog(text) {
    setLog(prev => [...prev, text]);
  }

  // Разовая миграция: переносит старые единые поля koCount/ksCount/playedAsSoldierCount,
  // awards, publicNote и disciplinaryActions в новую структуру, разделённую на
  // "общее для всего сообщества" (globalAwards/globalDisciplinaryActions) и
  // "привязанное к конкретной игре" (gameStats/gameAwards/gameDisciplinaryActions/gameNotes).
  // Старые данные считаются относящимися к Arma Reforger — именно на неё
  // до этого момента был рассчитан весь функционал сайта.
  async function migrateToScopedSchema() {
    setRunning(true);
    setLog([]);
    addLog("Переносим награды/дисциплину/статистику в новую схему (общее + по играм)...");

    const profilesSnap = await getDocs(collection(db, "profiles"));

    for (const docSnap of profilesSnap.docs) {
      const uid = docSnap.id;
      const p = docSnap.data();

      if (p.gameStats) {
        addLog(`${p.callsign} — уже в новой схеме, пропущен.`);
        continue;
      }

      const gameStats = {};
      const gameAwards = {};
      const gameDisciplinaryActions = {};
      const gameNotes = {};

      (p.gamesInterested || []).forEach(g => {
        if (g === "Arma Reforger") {
          gameStats[g] = {
            playedAsSoldierCount: Number(p.playedAsSoldierCount || 0),
            koCount: Number(p.koCount || 0),
            ksCount: Number(p.ksCount || 0)
          };
          gameAwards[g] = (p.awards || []).map(a => ({
            icon: a.icon,
            name: a.name || a.desc || "",
            description: a.description || ""
          }));
          gameDisciplinaryActions[g] = (p.disciplinaryActions || []).map(a => ({
            ...a,
            scope: "Arma Reforger"
          }));
          gameNotes[g] = p.publicNote || "";
        } else {
          gameStats[g] = { playedAsSoldierCount: 0, koCount: 0, ksCount: 0 };
          gameAwards[g] = [];
          gameDisciplinaryActions[g] = [];
          gameNotes[g] = "";
        }
      });

      await updateDoc(doc(db, "profiles", uid), {
        gameStats,
        gameAwards,
        gameDisciplinaryActions,
        gameNotes,
        globalAwards: [],
        globalDisciplinaryActions: [],
        birthDatePublic: true,
        extraContactsPublic: true
      });

      await setDoc(doc(db, "rosterPublic", uid), {
        callsign: p.callsign,
        gameRoles: p.gameRoles || {},
        gamesInterested: p.gamesInterested || [],
        gameStats,
        referredByUid: p.referredByUid || ""
      });

      addLog(`Перенесён: ${p.callsign}`);
    }

    addLog("Готово: миграция в новую scoped-схему завершена.");
    setRunning(false);
  }

  return (
    <main className="container">
      <h1>Миграция данных</h1>

      <div className="card">
        <h2>Перенос наград/дисциплины/статистики в новую схему</h2>
        <p>
          Разовая операция. Переносит старые единые поля (<code>koCount</code>,
          <code>ksCount</code>, <code>playedAsSoldierCount</code>, <code>awards</code>,
          <code>publicNote</code>, <code>disciplinaryActions</code>) в новую структуру,
          разделённую на общие для сообщества данные и данные по конкретным играм. Профили,
          у которых поле <code>gameStats</code> уже существует, автоматически пропускаются —
          безопасно запускать повторно.
        </p>
        <button className="btn" onClick={migrateToScopedSchema} disabled={running}>
          {running ? "Выполняется..." : "Перенести в новую схему"}
        </button>
      </div>

      <div className="card">
        <h2>Журнал выполнения</h2>
        <pre className="migration-log">{log.join("\n")}</pre>
      </div>
    </main>
  );
}
