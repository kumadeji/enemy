import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { db, STATUS_ORDER, GOOGLE_SHEETS_URL } from "../firebase";
import { doc, getDoc, updateDoc, deleteDoc, setDoc } from "firebase/firestore";
import { TIMEZONES } from "../data/timezones";
import ToggleSwitch from "../components/ToggleSwitch";
import { formatBirthDateInput, validateBirthDate } from "../utils/birthDate";
import { pluralize } from "../utils/pluralize";
import { TIMES_FORMS } from "../data/statusForms";
import AwardChip from "../components/AwardChip";

export default function AdminPlayerDetail() {
  const { uid } = useParams();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [application, setApplication] = useState(null);
  const [note, setNote] = useState({ privateNote: "" });
  const [awardIcon, setAwardIcon] = useState("");
  const [awardDesc, setAwardDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      const pSnap = await getDoc(doc(db, "profiles", uid));
      const aSnap = await getDoc(doc(db, "applications", uid));
      const nSnap = await getDoc(doc(db, "adminNotes", uid));
      if (pSnap.exists()) setProfile({ uid, ...pSnap.data() });
      if (aSnap.exists()) setApplication(aSnap.data());
      if (nSnap.exists()) setNote(nSnap.data());
    }
    load();
  }, [uid]);

  if (!profile || !application) return <main className="container"><p>Загрузка...</p></main>;

  function updateProfileField(field, value) {
    setProfile(prev => ({ ...prev, [field]: value }));
  }
  function updateAppField(field, value) {
    setApplication(prev => ({ ...prev, [field]: value }));
  }
  
  function adjustKo(delta) {
    setProfile(prev => ({ ...prev, koCount: Math.max(0, (Number(prev.koCount) || 0) + delta) }));
  }
  function adjustKs(delta) {
    setProfile(prev => ({ ...prev, ksCount: Math.max(0, (Number(prev.ksCount) || 0) + delta) }));
  }

  async function saveAll() {
    setSaving(true);
    setMessage("");
    try {
      await updateDoc(doc(db, "profiles", uid), {
        callsign: profile.callsign,
        status: profile.status,
        isSquadLeader: !!profile.isSquadLeader,
        gamesInterested: profile.gamesInterested,
        discordId: profile.discordId,
        steamId: profile.steamId,
        steamProfileUrl: profile.steamProfileUrl,
        armaId: profile.armaId || "",
        timezone: profile.timezone,
        birthDate: profile.birthDate || "",
        ksCount: Number(profile.ksCount || 0),
		koCount: Number(profile.koCount || 0),
        publicNote: profile.publicNote || "",
        extraContacts: profile.extraContacts || {}
      });

      await setDoc(doc(db, "rosterPublic", uid), {
        callsign: profile.callsign,
        status: profile.status,
        isSquadLeader: !!profile.isSquadLeader,
        gamesInterested: profile.gamesInterested,
        koCount: Number(profile.koCount || 0)
      });

      await updateDoc(doc(db, "applications", uid), {
        fullName: application.fullName,
        age: Number(application.age),
        birthDate: application.birthDate || "",
        availability: application.availability,
        whyJoin: application.whyJoin,
        howFound: application.howFound,
        timezone: application.timezone
      });

      await setDoc(doc(db, "adminNotes", uid), { privateNote: note.privateNote || "" });

      if (GOOGLE_SHEETS_URL) {
        fetch(GOOGLE_SHEETS_URL, {
          method: "POST",
          body: JSON.stringify({
            action: "update", uid,
            callsign: profile.callsign, email: application.email, fullName: application.fullName,
            age: application.age, steamProfileUrl: profile.steamProfileUrl, discordId: profile.discordId,
            armaId: profile.armaId, extraContacts: profile.extraContacts,
            gamesInterested: profile.gamesInterested, timezone: profile.timezone,
            availability: application.availability, whyJoin: application.whyJoin,
            howFound: application.howFound, charterAgreed: application.charterAgreed
          })
        }).catch(() => {});
      }

      setMessage("Сохранено.");
    } catch (err) {
      setMessage("Ошибка при сохранении: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function giveAward() {
    if (!awardIcon || !awardDesc) return;
    const awards = [...(profile.awards || []), { icon: awardIcon, desc: awardDesc }];
    await updateDoc(doc(db, "profiles", uid), { awards });
    setProfile(prev => ({ ...prev, awards }));
    setAwardIcon(""); setAwardDesc("");
  }

  async function removeAward(index) {
    const awards = (profile.awards || []).filter((_, i) => i !== index);
    await updateDoc(doc(db, "profiles", uid), { awards });
    setProfile(prev => ({ ...prev, awards }));
  }

  async function handleDelete() {
    if (!confirm(`Точно удалить пользователя ${profile.callsign}?`)) return;
    await deleteDoc(doc(db, "profiles", uid));
    await deleteDoc(doc(db, "applications", uid));
    await deleteDoc(doc(db, "adminNotes", uid));
    navigate("/admin");
  }

  return (
    <main className="container">
      <p><Link to="/admin">← Назад к списку</Link></p>
      <h1>{profile.callsign}</h1>

      <div className="card">
        <h2>Должность бойца</h2>
        <select value={profile.status} onChange={e => updateProfileField("status", e.target.value)}>
          {STATUS_ORDER.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      
        <ToggleSwitch
          checked={!!profile.isSquadLeader}
          onChange={e => updateProfileField("isSquadLeader", e.target.checked)}
          label="Командир отряда (КО) — дополнительная должность, участвует в очереди на командование отрядом"
        />
      </div>

      <div className="card">
        <h2>Статистика</h2>
        <div className="stats-row">
          <div className="stat-block">
            <span className="stat-value">{profile.koCount || 0}</span>
            <span className="stat-label">{pluralize(profile.koCount || 0, TIMES_FORMS)} отыграл за КО</span>
            <div className="stat-counter-buttons">
              <button type="button" className="icon-btn" onClick={() => adjustKo(-1)} disabled={(profile.koCount || 0) <= 0}>−</button>
              <button type="button" className="icon-btn" onClick={() => adjustKo(1)}>+</button>
            </div>
          </div>
          <div className="stat-block">
            <span className="stat-value">{profile.ksCount || 0}</span>
            <span className="stat-label">{pluralize(profile.ksCount || 0, TIMES_FORMS)} отыграл за КС</span>
            <div className="stat-counter-buttons">
              <button type="button" className="icon-btn" onClick={() => adjustKs(-1)} disabled={(profile.ksCount || 0) <= 0}>−</button>
              <button type="button" className="icon-btn" onClick={() => adjustKs(1)}>+</button>
            </div>
          </div>
        </div>
      </div>


      <div className="card">
        <h2>Личные данные</h2>
        <label>Позывной</label>
        <input type="text" value={profile.callsign} onChange={e => updateProfileField("callsign", e.target.value)} />
        <div className="field-hint">Меняйте только в исключительных случаях.</div>

        <label>Имя и фамилия</label>
        <input type="text" value={application.fullName} onChange={e => updateAppField("fullName", e.target.value)} />

        <label>Email (логин, виден только комбату и его заместителям)</label>
        <input type="email" value={application.email} disabled />

        <label>Возраст</label>
        <input type="number" value={application.age} onChange={e => updateAppField("age", e.target.value)} />

        <label>Дата рождения</label>
        <input
          type="text"
          placeholder="ДД.ММ.ГГГГ"
          maxLength={10}
          value={profile.birthDate || ""}
          onChange={e => updateProfileField("birthDate", formatBirthDateInput(e.target.value))}
        />
        {profile.birthDate && validateBirthDate(profile.birthDate) && (
          <div className="error">{validateBirthDate(profile.birthDate)}</div>
        )}

      </div>

      <div className="card">
        <h2>Контакты и верификация</h2>
        <label>Discord ID</label>
        <input type="text" value={profile.discordId} onChange={e => updateProfileField("discordId", e.target.value)} />

        <label>Steam ID</label>
        <input type="text" value={profile.steamId}
          onChange={e => {
            const val = e.target.value;
            updateProfileField("steamId", val);
            updateProfileField("steamProfileUrl", val ? `https://steamcommunity.com/profiles/${val}/` : "");
          }} />
        {profile.steamProfileUrl && <div className="field-hint"><a href={profile.steamProfileUrl} target="_blank" rel="noreferrer">{profile.steamProfileUrl}</a></div>}

        <label>Arma ID</label>
        <input type="text" value={profile.armaId || ""} onChange={e => updateProfileField("armaId", e.target.value)} />

        <label>Часовой пояс</label>
        <select value={profile.timezone} onChange={e => updateProfileField("timezone", e.target.value)}>
          {TIMEZONES.map(tz => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
        </select>

        <label>Доп. контакты — Телефон</label>
        <input type="text" value={profile.extraContacts?.phone || ""}
          onChange={e => updateProfileField("extraContacts", { ...profile.extraContacts, phone: e.target.value })} />
        <label>Доп. контакты — Telegram</label>
        <input type="text" value={profile.extraContacts?.telegram || ""}
          onChange={e => updateProfileField("extraContacts", { ...profile.extraContacts, telegram: e.target.value })} />
        <label>Доп. контакты — ВКонтакте</label>
        <input type="text" value={profile.extraContacts?.vk || ""}
          onChange={e => updateProfileField("extraContacts", { ...profile.extraContacts, vk: e.target.value })} />
        <label>Доп. контакты — Другое</label>
        <input type="text" value={profile.extraContacts?.other || ""}
          onChange={e => updateProfileField("extraContacts", { ...profile.extraContacts, other: e.target.value })} />
      </div>

      <div className="card">
        <h2>Заявка</h2>
        <label>Доступность для игр</label>
        <textarea value={application.availability} onChange={e => updateAppField("availability", e.target.value)} />
        <label>Почему хочет вступить</label>
        <textarea value={application.whyJoin} onChange={e => updateAppField("whyJoin", e.target.value)} />
        <label>Откуда узнал</label>
        <textarea value={application.howFound} onChange={e => updateAppField("howFound", e.target.value)} />
      </div>

      <div className="card">
        <h2>Награды</h2>
        {(profile.awards || []).map((a, i) => (
          <div key={i} className="award-row">
            <AwardChip icon={a.icon} desc={a.desc} />
            <button className="btn secondary" onClick={() => removeAward(i)}>Изъять награду</button>
          </div>
        ))}
        <input type="text" placeholder="Иконка (emoji)" value={awardIcon} onChange={e => setAwardIcon(e.target.value)} />
        <input type="text" placeholder="Описание награды" value={awardDesc} onChange={e => setAwardDesc(e.target.value)} />
        <button className="btn secondary" onClick={giveAward}>Выдать награду</button>
      </div>

      <div className="card">
        <h2>Заметки комбата</h2>
        <label>Публичная заметка — «Комбат о бойце» <span className="optional-tag">видна всем в профиле</span></label>
        <textarea value={profile.publicNote || ""} onChange={e => updateProfileField("publicNote", e.target.value)} />
		
        <label>Внутренняя заметка<span className="optional-tag">видна только комбату и его заместителям</span></label>
        <textarea value={note.privateNote || ""} onChange={e => setNote({ privateNote: e.target.value })} />
      </div>
	  
      <div className="save-actions">
        <button className="btn btn-large" onClick={saveAll} disabled={saving}>
          {saving ? "Сохранение..." : "Сохранить все изменения"}
        </button>
        {message && <p className="hint">{message}</p>}
      </div>
      
      <div className="card danger-zone">
        <h2>Технический раздел</h2>
        <button className="btn danger" onClick={handleDelete}>Удалить бойца из базы данных</button>
      </div>

    </main>
  );
}
