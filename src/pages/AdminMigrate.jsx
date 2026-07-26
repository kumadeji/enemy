import { useState } from "react";
import { db, GOOGLE_SHEETS_URL } from "../firebase";
import { collection, getDocs, doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";

export default function AdminMigrate() {
  const { isAdmin } = useAuth();
  const [log, setLog] = useState([]);
  const [running, setRunning] = useState(false);

  function addLog(text) {
    setLog(prev => [...prev, text]);
  }

  async function runMigration() {
    setRunning(true);
    setLog([]);
    addLog("Начинаем обновление структуры базы данных...");

    const profilesSnap = await getDocs(collection(db, "profiles"));
    const callsignToUid = {};
    profilesSnap.docs.forEach(d => {
      callsignToUid[(d.data().callsign || "").toLowerCase()] = d.id;
    });

    // ---- Профили ----
    for (const docSnap of profilesSnap.docs) {
      const uid = docSnap.id;
      const p = docSnap.data();
      const patch = {};

      if (typeof p.discordId === "undefined") {
        patch.discordId = p.discordTag || "";
      }
      if (typeof p.steamId === "undefined") {
        const match = (p.steamUrl || "").match(/profiles\/(\d+)/);
        patch.steamId = match ? match[1] : "";
        patch.steamProfileUrl = match
          ? `https://steamcommunity.com/profiles/${match[1]}/`
          : (p.steamUrl || "");
        if (!match && p.steamUrl) {
          patch.legacySteamUrl = p.steamUrl; // сохраняем старую ссылку, чтобы не потерять её
        }
      }
      if (typeof p.extraContacts === "string" || typeof p.extraContacts === "undefined") {
        patch.extraContacts = {
          phone: "", telegram: "", vk: "",
          other: typeof p.extraContacts === "string" ? p.extraContacts : ""
        };
      }
      if (typeof p.armaId === "undefined") patch.armaId = "";
      if (typeof p.timezone === "undefined") patch.timezone = "";
      if (typeof p.birthDate === "undefined") patch.birthDate = "";
      if (typeof p.koCount === "undefined") patch.koCount = 0;
      if (typeof p.ksCount === "undefined") patch.ksCount = 0;
      if (typeof p.isSquadLeader === "undefined") patch.isSquadLeader = false;
      if (typeof p.publicNote === "undefined") patch.publicNote = "";

      if (Object.keys(patch).length > 0) {
        await updateDoc(doc(db, "profiles", uid), patch);
        addLog(`Профиль «${p.callsign}» дополнен: ${Object.keys(patch).join(", ")}`);
      } else {
        addLog(`Профиль «${p.callsign}» уже в новом формате — пропущен.`);
      }
    }

    // ---- Анкеты ----
    const appsSnap = await getDocs(collection(db, "applications"));
    for (const docSnap of appsSnap.docs) {
      const uid = docSnap.id;
      const a = docSnap.data();
      const patch = {};

      if (typeof a.discordId === "undefined") patch.discordId = a.discordTag || "";
      if (typeof a.steamId === "undefined") {
        const match = (a.steamUrl || "").match(/profiles\/(\d+)/);
        patch.steamId = match ? match[1] : "";
        patch.steamProfileUrl = match
          ? `https://steamcommunity.com/profiles/${match[1]}/`
          : (a.steamUrl || "");
      }
      if (typeof a.extraContacts === "string" || typeof a.extraContacts === "undefined") {
        patch.extraContacts = {
          phone: "", telegram: "", vk: "",
          other: typeof a.extraContacts === "string" ? a.extraContacts : ""
        };
      }
      if (typeof a.armaId === "undefined") patch.armaId = "";
      if (typeof a.birthDate === "undefined") patch.birthDate = "";

      if (Object.keys(patch).length > 0) {
        await updateDoc(doc(db, "applications", uid), patch);
        addLog(`Анкета (${uid}) дополнена: ${Object.keys(patch).join(", ")}`);
      }
    }

    // ---- Очередь ----
    const queueSnap = await getDoc(doc(db, "queue", "state"));
    if (queueSnap.exists()) {
      const oldCurrent = queueSnap.data().current || [];
      const needsMigration = oldCurrent.some(item => !item.uid);
      if (needsMigration) {
        const newCurrent = [];
        oldCurrent.forEach(item => {
          if (item.uid) { newCurrent.push(item); return; }
          const foundUid = callsignToUid[(item.callsign || "").toLowerCase()];
          if (foundUid) {
            newCurrent.push({ uid: foundUid });
            addLog(`Очередь: «${item.callsign}» сопоставлен с зарегистрированным игроком.`);
          } else {
            addLog(`Очередь: «${item.callsign}» не найден среди игроков сайта — удалён из очереди, добавьте вручную на странице очереди.`);
          }
        });
        await setDoc(doc(db, "queue", "state"), { current: newCurrent });
        addLog("Очередь переведена в новый формат.");
      } else {
        addLog("Очередь уже в новом формате — пропущена.");
      }
    } else {
      addLog("Документ очереди не найден — ничего не мигрируем, очередь начнётся с чистого листа.");
    }

    addLog("Готово: обновление структуры базы данных завершено.");
    setRunning(false);
  }

  async function resyncGoogleSheets() {
    if (!GOOGLE_SHEETS_URL) { addLog("Google Sheets URL не задан — пропускаем."); return; }
    setRunning(true);
    addLog("Начинаем пересборку Google Таблицы по всем участникам...");

    const profilesSnap = await getDocs(collection(db, "profiles"));
    for (const docSnap of profilesSnap.docs) {
      const uid = docSnap.id;
      const p = docSnap.data();
      const appSnap = await getDoc(doc(db, "applications", uid));
      const a = appSnap.exists() ? appSnap.data() : {};

      await fetch(GOOGLE_SHEETS_URL, {
        method: "POST",
        body: JSON.stringify({
          action: "update",
          uid,
          callsign: p.callsign,
          email: a.email || "",
          fullName: a.fullName || "",
          age: a.age || "",
          steamProfileUrl: p.steamProfileUrl || "",
          discordId: p.discordId || "",
          armaId: p.armaId || "",
          extraContacts: p.extraContacts || {},
          gamesInterested: p.gamesInterested || [],
          timezone: p.timezone || "",
          availability: a.availability || "",
          whyJoin: a.whyJoin || "",
          howFound: a.howFound || "",
          charterAgreed: a.charterAgreed || false
        })
      }).catch(() => {});

      addLog(`Отправлено в таблицу: ${p.callsign}`);
      await new Promise(res => setTimeout(res, 400)); // пауза, чтобы не перегружать Apps Script
    }

    addLog("Пересборка Google Таблицы завершена.");
    setRunning(false);
  }

  if (!isAdmin) return null;

  return (
    <main className="container">
      <h1>Миграция данных (разовая операция)</h1>
      <div className="card">
        <p>
          Этот инструмент безопасно дополняет старые записи недостающими полями новой
          структуры сайта, не трогая уже корректные данные. Можно запускать повторно без вреда.
        </p>
        <button className="btn" onClick={runMigration} disabled={running}>
          1. Обновить структуру базы данных
        </button>
        <button className="btn secondary" onClick={resyncGoogleSheets} disabled={running}>
          2. Пересобрать Google Таблицу
        </button>
      </div>
      <div className="card">
        <h2>Журнал выполнения</h2>
        <pre className="migration-log">{log.join("\n")}</pre>
      </div>
    </main>
  );
}
