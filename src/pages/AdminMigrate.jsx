import { useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, doc, updateDoc, setDoc } from "firebase/firestore";

// Соответствие старых единых статусов новой системе "состав + должность"
// (используется только для разовой миграции игроков, зарегистрировавшихся
// до введения системы gameRoles)
const STATUS_TO_ROLE = {
  "Новобранец": { composition: "Отбор", position: "Новобранец" },
  "Боец запаса": { composition: "Запас", position: "Боец" },
  "Боец личного состава": { composition: "Личный состав", position: "Боец" },
  "Заместитель комбата": { composition: "Личный состав", position: "Зам. командира батальона" },
  "Комбат": { composition: "Личный состав", position: "Командир батальона" },
  "Дезертир": { composition: "Отставка", position: "Дезертир" }
};

export default function AdminMigrate() {
  const [log, setLog] = useState([]);
  const [running, setRunning] = useState(false);

  function addLog(text) {
    setLog(prev => [...prev, text]);
  }

  // Разовая миграция: переносит старое единое поле status/isSquadLeader
  // в новую структуру profile.gameRoles (состав + должность по каждой игре)
  async function migrateToGameRoles() {
    setRunning(true);
    addLog("Переносим старые статусы в новую систему составов/должностей...");

    const profilesSnap = await getDocs(collection(db, "profiles"));
    for (const docSnap of profilesSnap.docs) {
      const uid = docSnap.id;
      const p = docSnap.data();

      if (p.gameRoles) {
        addLog(`${p.callsign} — уже в новом формате, пропущен.`);
        continue;
      }

      const mapped = STATUS_TO_ROLE[p.status] || { composition: "Отбор", position: "Новобранец" };
      const gameRoles = {};
      (p.gamesInterested || []).forEach(g => {
        gameRoles[g] = g === "Arma Reforger"
          ? { ...mapped, isSquadLeader: !!p.isSquadLeader }
          : { composition: "Отбор", position: "Новобранец", isSquadLeader: false };
      });

      await updateDoc(doc(db, "profiles", uid), { gameRoles });
      await setDoc(doc(db, "rosterPublic", uid), {
        callsign: p.callsign,
        gameRoles,
        gamesInterested: p.gamesInterested || [],
        koCount: Number(p.koCount || 0),
        ksCount: Number(p.ksCount || 0),
        playedAsSoldierCount: Number(p.playedAsSoldierCount || 0)
      });

      addLog(`Перенесён: ${p.callsign} → ${JSON.stringify(gameRoles)}`);
    }

    addLog("Готово: миграция составов/должностей завершена.");
    setRunning(false);
  }

  // Разовая синхронизация публичной "облегчённой" копии профиля (rosterPublic)
  // на основе актуального содержимого полного профиля (profiles).
  // Полезно запускать повторно, если данные где-то разошлись.
  async function syncRosterPublic() {
    setRunning(true);
    addLog("Синхронизируем публичные записи состава (rosterPublic)...");

    const profilesSnap = await getDocs(collection(db, "profiles"));
    for (const docSnap of profilesSnap.docs) {
      const uid = docSnap.id;
      const p = docSnap.data();

      await setDoc(doc(db, "rosterPublic", uid), {
        callsign: p.callsign || "",
        gameRoles: p.gameRoles || {},
        gamesInterested: p.gamesInterested || [],
        koCount: Number(p.koCount || 0),
        ksCount: Number(p.ksCount || 0),
        playedAsSoldierCount: Number(p.playedAsSoldierCount || 0)
      });

      addLog(`Синхронизирован: ${p.callsign}`);
    }

    addLog(`Завершено. Обработано профилей: ${profilesSnap.docs.length}.`);
    setRunning(false);
  }

  return (
    <main className="container">
      <h1>Миграция и синхронизация данных</h1>

      <div className="card">
        <h2>1. Перенос старых статусов в новую систему составов/должностей</h2>
        <p>
          Разовая операция. Переносит старое единое поле <code>status</code> (например,
          «Боец личного состава») в новую структуру <code>gameRoles</code> — отдельно
          «Состав» и «Должность» по каждой игре. Профили, у которых <code>gameRoles</code>
          уже есть, автоматически пропускаются — безопасно запускать повторно.
        </p>
        <button className="btn" onClick={migrateToGameRoles} disabled={running}>
          {running ? "Выполняется..." : "Перенести статусы в gameRoles"}
        </button>
      </div>

      <div className="card">
        <h2>2. Синхронизация публичного состава (rosterPublic)</h2>
        <p>
          Пересоздаёт для каждого профиля его "облегчённую" публичную копию —
          используется страницами «Состав клана» и «Очередь на КО», которые
          доступны без авторизации. Полезно запускать, если после ручных
          правок в базе данные там разошлись.
        </p>
        <button className="btn secondary" onClick={syncRosterPublic} disabled={running}>
          {running ? "Выполняется..." : "Синхронизировать rosterPublic"}
        </button>
      </div>

      <div className="card">
        <h2>Журнал выполнения</h2>
        <pre className="migration-log">{log.join("\n")}</pre>
      </div>
    </main>
  );
}
