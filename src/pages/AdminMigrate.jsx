import { useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";

export default function AdminMigrate() {
  const [log, setLog] = useState([]);
  const [running, setRunning] = useState(false);

  function addLog(text) {
    setLog(prev => [...prev, text]);
  }

  async function syncRosterPublic() {
    setRunning(true);
    setLog([]);
    addLog("Начинаем создание публичных записей состава (rosterPublic)...");

    const profilesSnap = await getDocs(collection(db, "profiles"));

    for (const docSnap of profilesSnap.docs) {
      const uid = docSnap.id;
      const p = docSnap.data();

      await setDoc(doc(db, "rosterPublic", uid), {
        callsign: p.callsign || "",
        status: p.status || "Новобранец",
        isSquadLeader: !!p.isSquadLeader,
        gamesInterested: p.gamesInterested || [],
        koCount: Number(p.koCount || 0)
      });

      addLog(`Готово: ${p.callsign}`);
    }

    addLog(`Завершено. Обработано профилей: ${profilesSnap.docs.length}.`);
    setRunning(false);
  }

  return (
    <main className="container">
      <h1>Миграция: публичный состав (rosterPublic)</h1>
      <div className="card">
        <p>
          Разовый инструмент. Создаёт (или обновляет) в коллекции <code>rosterPublic</code>
          безопасную для публичного просмотра версию каждого профиля — без контактов,
          даты рождения и прочих приватных данных. После успешного запуска эту страницу
          можно удалить из проекта.
        </p>
        <button className="btn" onClick={syncRosterPublic} disabled={running}>
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
