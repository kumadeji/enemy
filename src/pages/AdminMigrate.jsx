import { useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, doc, getDoc, updateDoc, deleteDoc, deleteField } from "firebase/firestore";
import { buildRosterPublicPayload } from "../utils/rosterPublic";

export default function AdminMigrate() {
  const [log, setLog] = useState([]);
  const [running, setRunning] = useState(false);

  function addLog(text) {
    setLog(prev => [...prev, text]);
  }

  // Разовая консолидация: переносит applications/{uid} и adminNotes/{uid}
  // внутрь profiles/{uid}, чистит устаревшие legacy-поля и удаляет старые
  // документы. После этого коллекции applications/adminNotes становятся
  // полностью пустыми — их можно будет удалить в консоли Firebase вручную.
  async function consolidateCollections() {
    setRunning(true);
    setLog([]);
    addLog("Начинаем консолидацию profiles + applications + adminNotes...");

    const profilesSnap = await getDocs(collection(db, "profiles"));

    for (const docSnap of profilesSnap.docs) {
      const uid = docSnap.id;
      const p = docSnap.data();

      const appSnap = await getDoc(doc(db, "applications", uid));
      const noteSnap = await getDoc(doc(db, "adminNotes", uid));
      const app = appSnap.exists() ? appSnap.data() : {};
      const note = noteSnap.exists() ? noteSnap.data() : {};

      const merged = {
        ...p,
        email: app.email || p.email || "",
        fullName: app.fullName || p.fullName || "",
        age: Number(app.age || p.age || 0),
        availability: app.availability || p.availability || "",
        whyJoin: app.whyJoin || p.whyJoin || "",
        howFound: app.howFound || p.howFound || "",
        referrerCallsign: app.referrerCallsign || p.referrerCallsign || "",
        hoursByGame: app.hoursByGame || p.hoursByGame || {},
        experienceByGame: app.experienceByGame || p.experienceByGame || {},
        charterAgreed: app.charterAgreed ?? p.charterAgreed ?? false,
        adminPrivateNote: note.privateNote || p.adminPrivateNote || ""
      };

      // Удаляем устаревшие legacy-поля, оставшиеся от прошлых версий схемы
      const legacyCleanup = {
        discordTag: deleteField(),
        steamUrl: deleteField(),
        legacySteamUrl: deleteField(),
        status: deleteField(),
        isSquadLeader: deleteField(),
        koCount: deleteField(),
        ksCount: deleteField(),
        playedAsSoldierCount: deleteField(),
        awards: deleteField(),
        publicNote: deleteField(),
        extraContactsPublic: deleteField()
      };

      await updateDoc(doc(db, "profiles", uid), {
        email: merged.email, fullName: merged.fullName, age: merged.age,
        availability: merged.availability, whyJoin: merged.whyJoin, howFound: merged.howFound,
        referrerCallsign: merged.referrerCallsign, hoursByGame: merged.hoursByGame,
        experienceByGame: merged.experienceByGame, charterAgreed: merged.charterAgreed,
        adminPrivateNote: merged.adminPrivateNote,
        ...legacyCleanup
      });

      await updateDoc(doc(db, "rosterPublic", uid), buildRosterPublicPayload(merged));

      if (appSnap.exists()) await deleteDoc(doc(db, "applications", uid));
      if (noteSnap.exists()) await deleteDoc(doc(db, "adminNotes", uid));

      addLog(`Объединён и очищен: ${p.callsign}`);
    }

    addLog("Готово: консолидация завершена. Коллекции applications и adminNotes теперь пусты.");
    setRunning(false);
  }

  return (
    <main className="container">
      <h1>Миграция данных</h1>

      <div className="card">
        <h2>Консолидация коллекций (applications + adminNotes → profiles)</h2>
        <p>
          Разовая операция. Переносит содержимое <code>applications</code> и <code>adminNotes</code>
          внутрь <code>profiles</code>, удаляет устаревшие поля прошлых версий схемы и полностью
          очищает старые коллекции. Безопасно запускать повторно — если данные уже перенесены,
          операция просто ничего не найдёт для переноса.
        </p>
        <button className="btn" onClick={consolidateCollections} disabled={running}>
          {running ? "Выполняется..." : "Запустить консолидацию"}
        </button>
      </div>

      <div className="card">
        <h2>Журнал выполнения</h2>
        <pre className="migration-log">{log.join("\n")}</pre>
      </div>
    </main>
  );
}
