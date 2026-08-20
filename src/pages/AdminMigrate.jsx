import { useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { buildRosterPublicPayload } from "../utils/rosterPublic";

export default function AdminMigrate() {
  const [log, setLog] = useState([]);
  const [running, setRunning] = useState(false);

  function addLog(text) {
    setLog(prev => [...prev, text]);
  }

  // Разовое исправление: пересобирает rosterPublic на основе актуальных
  // данных из profiles с помощью обновлённой buildRosterPublicPayload
  // (с fallback-вычислением telegramUrl/vkUrl из сырого ID, если
  // предвычисленное поле пустое). Данные в profiles не трогает — только
  // перезаписывает публичный срез.
  async function resyncRosterPublicContacts() {
    setRunning(true);
    setLog([]);
    addLog("Пересобираем rosterPublic на основе актуальных profiles...");

    const profilesSnap = await getDocs(collection(db, "profiles"));

    for (const docSnap of profilesSnap.docs) {
      const uid = docSnap.id;
      const p = docSnap.data();

      await setDoc(doc(db, "rosterPublic", uid), buildRosterPublicPayload(p));
      addLog(`Пересобран: ${p.callsign}`);
    }

    addLog("Готово: rosterPublic пересобран для всех бойцов.");
    setRunning(false);
  }

  return (
    <main className="container">
      <h1>Миграция данных</h1>

      <div className="card">
        <h2>Пересборка rosterPublic (контакты Telegram/ВКонтакте)</h2>
        <p>
          Разовая операция. Пересобирает публичный срез каждого профиля на основе
          актуальных данных из <code>profiles</code>, с корректным вычислением
          ссылок на Telegram/ВКонтакте даже для профилей, где эти ссылки ранее
          не были рассчитаны заранее. Безопасно запускать повторно.
        </p>
        <button className="btn" onClick={resyncRosterPublicContacts} disabled={running}>
          {running ? "Выполняется..." : "Пересобрать rosterPublic"}
        </button>
      </div>

      <div className="card">
        <h2>Журнал выполнения</h2>
        <pre className="migration-log">{log.join("\n")}</pre>
      </div>
    </main>
  );
}
