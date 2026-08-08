import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { db, GOOGLE_SHEETS_URL } from "../firebase";
import { doc, getDoc, updateDoc, deleteDoc, setDoc } from "firebase/firestore";
import { TIMEZONES } from "../data/timezones";
import {
  GAMES,
  COMPOSITIONS_ORDER,
  POSITIONS_BY_COMPOSITION,
  canBeSquadLeader,
  defaultGameRole
} from "../data/gameRoles";
import ToggleSwitch from "../components/ToggleSwitch";
import { formatBirthDateInput, validateBirthDate } from "../utils/birthDate";
import { pluralize } from "../utils/pluralize";
import { TIMES_FORMS } from "../data/statusForms";
import { createAction, isActionActive } from "../utils/discipline";
import AwardChip from "../components/AwardChip";
import CopyableField from "../components/CopyableField";
import DisciplinaryList from "../components/DisciplinaryList";

export default function AdminPlayerDetail() {
  const { uid } = useParams();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [application, setApplication] = useState(null);
  const [note, setNote] = useState({ privateNote: "" });
  const [awardIcon, setAwardIcon] = useState("");
  const [awardName, setAwardName] = useState("");
  const [awardDescription, setAwardDescription] = useState("");
  const [activeGame, setActiveGame] = useState(GAMES[0]);
  const [newActionType, setNewActionType] = useState("Замечание");
  const [newActionReason, setNewActionReason] = useState("");
  const [disciplineError, setDisciplineError] = useState("");
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

  function adjustSoldier(delta) {
    setProfile(prev => ({ ...prev, playedAsSoldierCount: Math.max(0, (Number(prev.playedAsSoldierCount) || 0) + delta) }));
  }
  function adjustKo(delta) {
    setProfile(prev => ({ ...prev, koCount: Math.max(0, (Number(prev.koCount) || 0) + delta) }));
  }
  function adjustKs(delta) {
    setProfile(prev => ({ ...prev, ksCount: Math.max(0, (Number(prev.ksCount) || 0) + delta) }));
  }

  // Обновляет состав/должность/роль КО для конкретной игры внутри profile.gameRoles
  function updateGameRole(game, field, value) {
    setProfile(prev => {
      const current = prev.gameRoles?.[game] || defaultGameRole();
      const updated = { ...current, [field]: value };
      // При смене состава сбрасываем должность на первую допустимую для нового состава
      if (field === "composition") {
        updated.position = POSITIONS_BY_COMPOSITION[value][0];
        if (!canBeSquadLeader(value)) updated.isSquadLeader = false;
      }
      return { ...prev, gameRoles: { ...prev.gameRoles, [game]: updated } };
    });
  }

  // Выдача нового дисциплинарного взыскания (не более 3 одновременно действующих замечаний)
  function issueAction() {
    if (!newActionReason.trim()) return;
    const actions = profile.disciplinaryActions || [];
    const activeWarnings = actions.filter(a => a.type === "Замечание" && isActionActive(a));
    if (newActionType === "Замечание" && activeWarnings.length >= 3) {
      setDisciplineError("У бойца уже 3 действующих замечания — новое выдать нельзя. Дальше — выговор.");
      return;
    }
    setDisciplineError("");
    const newAction = createAction(newActionType, newActionReason.trim());
    setProfile(prev => ({ ...prev, disciplinaryActions: [...(prev.disciplinaryActions || []), newAction] }));
    setNewActionReason("");
  }

  function removeAction(actionId) {
    setProfile(prev => ({
      ...prev,
      disciplinaryActions: (prev.disciplinaryActions || []).filter(a => a.id !== actionId)
    }));
  }

  async function saveAll() {
    setSaving(true);
    setMessage("");
    try {
      await updateDoc(doc(db, "profiles", uid), {
        callsign: profile.callsign,
        gameRoles: profile.gameRoles || {},
        gamesInterested: profile.gamesInterested,
        discordId: profile.discordId,
        steamId: profile.steamId,
        steamProfileUrl: profile.steamProfileUrl,
        armaId: profile.armaId || "",
        timezone: profile.timezone,
        birthDate: profile.birthDate || "",
        ksCount: Number(profile.ksCount || 0),
        koCount: Number(profile.koCount || 0),
        playedAsSoldierCount: Number(profile.playedAsSoldierCount || 0),
        publicNote: profile.publicNote || "",
        extraContacts: profile.extraContacts || {},
        disciplinaryActions: profile.disciplinaryActions || [],
        awards: profile.awards || []
      });

      // Синхронизируем публичную "облегчённую" копию для страниц Состава и Очереди
      await setDoc(doc(db, "rosterPublic", uid), {
        callsign: profile.callsign,
        gameRoles: profile.gameRoles || {},
        gamesInterested: profile.gamesInterested,
        koCount: Number(profile.koCount || 0),
        ksCount: Number(profile.ksCount || 0),
        playedAsSoldierCount: Number(profile.playedAsSoldierCount || 0)
      });

      await updateDoc(doc(db, "applications", uid), {
        fullName: application.fullName,
        age: Number(application.age),
        birthDate: application.birthDate || "",
        availability: application.availability,
        whyJoin: application.whyJoin,
        howFound: application.howFound || "",
        referredByText: application.referredByText || "",
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
    if (!awardIcon || !awardName) return;
    const awards = [...(profile.awards || []), { icon: awardIcon, name: awardName, description: awardDescription }];
    await updateDoc(doc(db, "profiles", uid), { awards });
    setProfile(prev => ({ ...prev, awards }));
    setAwardIcon(""); setAwardName(""); setAwardDescription("");
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

  const currentGameRole = profile.gameRoles?.[activeGame] || defaultGameRole();

  return (
    <main className="container">
      <p><Link to="/admin">← Назад к списку</Link></p>
      <h1>{profile.callsign}</h1>

      {/* ---------- Состав и должность (отдельно по каждой игре) ---------- */}
      <div className="card">
        <h2>Состав и должность</h2>
        <div className="game-tabs">
          {GAMES.map(g => (
            <button
              key={g}
              type="button"
              className={`tab-btn ${activeGame === g ? "active" : ""}`}
              onClick={() => setActiveGame(g)}
            >
              {g}
            </button>
          ))}
        </div>

        <div className="game-role-editor">
          <label>Состав</label>
          <select
            value={currentGameRole.composition}
            onChange={e => updateGameRole(activeGame, "composition", e.target.value)}
          >
            {COMPOSITIONS_ORDER.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <label>Должность</label>
          <select
            value={currentGameRole.position}
            onChange={e => updateGameRole(activeGame, "position", e.target.value)}
          >
            {POSITIONS_BY_COMPOSITION[currentGameRole.composition].map(pos => (
              <option key={pos} value={pos}>{pos}</option>
            ))}
          </select>

          {canBeSquadLeader(currentGameRole.composition) && (
            <ToggleSwitch
              checked={!!currentGameRole.isSquadLeader}
              onChange={e => updateGameRole(activeGame, "isSquadLeader", e.target.checked)}
              label="Командир отделения — дополнительная должность, участвует в очереди на командование"
            />
          )}
        </div>
      </div>

      {/* ---------- Статистика: боец / КО / КС ---------- */}
      <div className="card">
        <h2>Статистика</h2>
        <div className="profile-stats-row">
          <div className="profile-stat-card">
            <span className="stat-value">{profile.playedAsSoldierCount || 0}</span>
            <span className="stat-label">{pluralize(profile.playedAsSoldierCount || 0, TIMES_FORMS)} отыграл как боец</span>
            <div className="stat-counter-buttons">
              <button type="button" className="icon-btn" onClick={() => adjustSoldier(-1)} disabled={(profile.playedAsSoldierCount || 0) <= 0}>−</button>
              <button type="button" className="icon-btn" onClick={() => adjustSoldier(1)}>+</button>
            </div>
          </div>
          <div className="profile-stat-card">
            <span className="stat-value">{profile.koCount || 0}</span>
            <span className="stat-label">{pluralize(profile.koCount || 0, TIMES_FORMS)} отыграл за КО</span>
            <div className="stat-counter-buttons">
              <button type="button" className="icon-btn" onClick={() => adjustKo(-1)} disabled={(profile.koCount || 0) <= 0}>−</button>
              <button type="button" className="icon-btn" onClick={() => adjustKo(1)}>+</button>
            </div>
          </div>
          <div className="profile-stat-card">
            <span className="stat-value">{profile.ksCount || 0}</span>
            <span className="stat-label">{pluralize(profile.ksCount || 0, TIMES_FORMS)} отыграл за КС</span>
            <div className="stat-counter-buttons">
              <button type="button" className="icon-btn" onClick={() => adjustKs(-1)} disabled={(profile.ksCount || 0) <= 0}>−</button>
              <button type="button" className="icon-btn" onClick={() => adjustKs(1)}>+</button>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- Личные данные ---------- */}
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

      {/* ---------- Контакты и верификация ---------- */}
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
        {profile.steamId && (
          <div className="field-hint">
            <CopyableField value={profile.steamId} />
          </div>
        )}
        {profile.steamProfileUrl && (
          <div className="field-hint">
            <a href={profile.steamProfileUrl} target="_blank" rel="noreferrer">{profile.steamProfileUrl}</a>
          </div>
        )}

        <label>Arma ID</label>
        <input type="text" value={profile.armaId || ""} onChange={e => updateProfileField("armaId", e.target.value)} />
        {profile.armaId && (
          <div className="field-hint">
            <CopyableField value={profile.armaId} />
          </div>
        )}

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

      {/* ---------- Заявка ---------- */}
      <div className="card">
        <h2>Заявка</h2>
        <label>Доступность для игр</label>
        <textarea value={application.availability} onChange={e => updateAppField("availability", e.target.value)} />
        <label>Почему хочет вступить</label>
        <textarea value={application.whyJoin} onChange={e => updateAppField("whyJoin", e.target.value)} />

        <label>Откуда узнал о клане (если указано текстом, а не выбором игрока)</label>
        <textarea value={application.howFound || ""} onChange={e => updateAppField("howFound", e.target.value)} />
        <div className="field-hint">
          Если игрок при регистрации выбрал «Меня пригласил игрок с сайта» — эта связь хранится
          отдельно (поле referredByUid в профиле) и отображается прямо в личном деле пригласившего.
          Здесь можно поправить текстовое пояснение задним числом, если нужно.
        </div>
      </div>

      {/* ---------- Награды ---------- */}
      <div className="card">
        <h2>Награды</h2>
        {(profile.awards || []).map((a, i) => (
          <div key={i} className="award-row">
            <AwardChip icon={a.icon} name={a.name || a.desc} description={a.description || ""} />
            <button className="btn secondary" onClick={() => removeAward(i)}>Изъять награду</button>
          </div>
        ))}
        <input type="text" placeholder="Иконка (эмодзи)" value={awardIcon} onChange={e => setAwardIcon(e.target.value)} />
        <input type="text" placeholder="Название награды" value={awardName} onChange={e => setAwardName(e.target.value)} />
        <textarea placeholder="Развёрнутое описание — за что дана награда" value={awardDescription} onChange={e => setAwardDescription(e.target.value)} />
        <button className="btn secondary" onClick={giveAward}>Выдать награду</button>
      </div>

      {/* ---------- Дисциплинарные взыскания ---------- */}
      <div className="card">
        <h2>Дисциплинарные взыскания</h2>
        <DisciplinaryList actions={profile.disciplinaryActions || []} showHistory={true} />

        <label>Тип взыскания</label>
        <select value={newActionType} onChange={e => setNewActionType(e.target.value)}>
          <option value="Замечание">Замечание (действует 1 месяц)</option>
          <option value="Выговор">Выговор (действует 3 месяца)</option>
        </select>
        <label>Причина</label>
        <textarea value={newActionReason} onChange={e => setNewActionReason(e.target.value)} />
        <button className="btn secondary" onClick={issueAction}>Выдать взыскание</button>
        {disciplineError && <div className="error">{disciplineError}</div>}

        {(profile.disciplinaryActions || []).length > 0 && (
          <>
            <label style={{ marginTop: 16 }}>Удалить запись из истории (техническая правка)</label>
            <div className="checkbox-row">
              {profile.disciplinaryActions.map(a => (
                <button key={a.id} type="button" className="btn-mini" onClick={() => removeAction(a.id)}>
                  Удалить: {a.type} от {new Date(a.issuedAtMs).toLocaleDateString("ru-RU")}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ---------- Заметки комбата ---------- */}
      <div className="card">
        <h2>Заметки комбата</h2>
        <label>Публичная заметка — «Комбат о бойце» <span className="optional-tag">видна всем в профиле</span></label>
        <textarea value={profile.publicNote || ""} onChange={e => updateProfileField("publicNote", e.target.value)} />

        <label>Внутренняя заметка <span className="optional-tag">видна только комбату и его заместителям</span></label>
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
