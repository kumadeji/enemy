import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { db, GOOGLE_SHEETS_URL } from "../firebase";
import { doc, getDoc, updateDoc, deleteDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import {
  GAMES, COMPOSITIONS_ORDER, POSITIONS_BY_COMPOSITION, canBeSquadLeader, defaultGameRole,
  getCompositionColor, getPositionColor
} from "../data/gameRoles";
import { createAction, isActionActive } from "../utils/discipline";
import { pluralize } from "../utils/pluralize";
import { TIMES_FORMS } from "../data/statusForms";
import ToggleSwitch from "../components/ToggleSwitch";
import AwardChip from "../components/AwardChip";
import CopyableField from "../components/CopyableField";
import DisciplinaryList from "../components/DisciplinaryList";
import PrivacyToggleField from "../components/PrivacyToggleField";
import { ProfileTable, ProfileRow } from "../components/ProfileTable";

export default function AdminPlayerDetail() {
  const { uid } = useParams();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [application, setApplication] = useState(null);
  const [note, setNote] = useState({ privateNote: "" });
  const [activeGame, setActiveGame] = useState(GAMES[0]);
  const [invitees, setInvitees] = useState([]);
  const [inviter, setInviter] = useState(null);

  const [awardIcon, setAwardIcon] = useState("");
  const [awardName, setAwardName] = useState("");
  const [awardDescription, setAwardDescription] = useState("");
  const [awardScope, setAwardScope] = useState("game");

  const [actionType, setActionType] = useState("Замечание");
  const [actionReason, setActionReason] = useState("");
  const [actionScope, setActionScope] = useState("game");
  const [disciplineError, setDisciplineError] = useState("");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      const pSnap = await getDoc(doc(db, "profiles", uid));
      const aSnap = await getDoc(doc(db, "applications", uid));
      const nSnap = await getDoc(doc(db, "adminNotes", uid));
      if (pSnap.exists()) {
        const data = { uid, ...pSnap.data() };
        setProfile(data);
        setActiveGame(data.gamesInterested?.[0] || GAMES[0]);

        const q = query(collection(db, "rosterPublic"), where("referredByUid", "==", uid));
        const inviteSnap = await getDocs(q);
        setInvitees(inviteSnap.docs.map(d => ({ uid: d.id, callsign: d.data().callsign })));

        if (data.referredByUid) {
          const invSnap = await getDoc(doc(db, "rosterPublic", data.referredByUid));
          if (invSnap.exists()) setInviter({ uid: data.referredByUid, callsign: invSnap.data().callsign });
        }
      }
      if (aSnap.exists()) setApplication(aSnap.data());
      if (nSnap.exists()) setNote(nSnap.data());
    }
    load();
  }, [uid]);

  if (!profile || !application) return <main className="container"><p>Загрузка...</p></main>;

  function updateProfileField(field, value) { setProfile(prev => ({ ...prev, [field]: value })); }

  function updateGameRole(game, field, value) {
    setProfile(prev => {
      const current = prev.gameRoles?.[game] || defaultGameRole();
      const updated = { ...current, [field]: value };
      if (field === "composition") {
        updated.position = POSITIONS_BY_COMPOSITION[value][0];
        if (!canBeSquadLeader(value)) updated.isSquadLeader = false;
      }
      return { ...prev, gameRoles: { ...prev.gameRoles, [game]: updated } };
    });
  }

  function updateGameNote(game, value) {
    setProfile(prev => ({ ...prev, gameNotes: { ...prev.gameNotes, [game]: value } }));
  }

  function adjustStat(game, field, delta) {
    setProfile(prev => {
      const current = prev.gameStats?.[game] || { playedAsSoldierCount: 0, koCount: 0, ksCount: 0 };
      const updated = { ...current, [field]: Math.max(0, (Number(current[field]) || 0) + delta) };
      return { ...prev, gameStats: { ...prev.gameStats, [game]: updated } };
    });
  }

  function giveAward() {
    if (!awardIcon || !awardName) return;
    const award = { icon: awardIcon, name: awardName, description: awardDescription };
    if (awardScope === "global") {
      setProfile(prev => ({ ...prev, globalAwards: [...(prev.globalAwards || []), award] }));
    } else {
      setProfile(prev => ({
        ...prev,
        gameAwards: { ...prev.gameAwards, [activeGame]: [...(prev.gameAwards?.[activeGame] || []), award] }
      }));
    }
    setAwardIcon(""); setAwardName(""); setAwardDescription("");
  }

  function removeGlobalAward(index) {
    setProfile(prev => ({ ...prev, globalAwards: prev.globalAwards.filter((_, i) => i !== index) }));
  }
  function removeGameAward(game, index) {
    setProfile(prev => ({
      ...prev,
      gameAwards: { ...prev.gameAwards, [game]: prev.gameAwards[game].filter((_, i) => i !== index) }
    }));
  }

  function issueAction() {
    if (!actionReason.trim()) return;
    const existingActive = actionScope === "global"
      ? (profile.globalDisciplinaryActions || []).filter(a => a.type === "Замечание" && isActionActive(a))
      : (profile.gameDisciplinaryActions?.[activeGame] || []).filter(a => a.type === "Замечание" && isActionActive(a));
    if (actionType === "Замечание" && existingActive.length >= 3) {
      setDisciplineError("У бойца уже 3 действующих замечания — новое выдать нельзя. Дальше — только выговоры.");
      return;
    }
    setDisciplineError("");
    const newAction = createAction(actionType, actionReason.trim(), actionScope === "global" ? "global" : activeGame);
    if (actionScope === "global") {
      setProfile(prev => ({ ...prev, globalDisciplinaryActions: [...(prev.globalDisciplinaryActions || []), newAction] }));
    } else {
      setProfile(prev => ({
        ...prev,
        gameDisciplinaryActions: { ...prev.gameDisciplinaryActions, [activeGame]: [...(prev.gameDisciplinaryActions?.[activeGame] || []), newAction] }
      }));
    }
    setActionReason("");
  }

  async function toggleBirthDatePublic() {
    updateProfileField("birthDatePublic", !profile.birthDatePublic);
  }
  async function toggleContactsPublic() {
    updateProfileField("extraContactsPublic", !profile.extraContactsPublic);
  }

  async function saveAll() {
    setSaving(true);
    setMessage("");
    try {
      await updateDoc(doc(db, "profiles", uid), {
        gameRoles: profile.gameRoles || {},
        gameNotes: profile.gameNotes || {},
        gameStats: profile.gameStats || {},
        gameAwards: profile.gameAwards || {},
        gameDisciplinaryActions: profile.gameDisciplinaryActions || {},
        globalAwards: profile.globalAwards || [],
        globalDisciplinaryActions: profile.globalDisciplinaryActions || [],
        birthDatePublic: !!profile.birthDatePublic,
        extraContactsPublic: !!profile.extraContactsPublic
      });

      await setDoc(doc(db, "rosterPublic", uid), {
        callsign: profile.callsign,
        gameRoles: profile.gameRoles || {},
        gamesInterested: profile.gamesInterested,
        gameStats: profile.gameStats || {},
        referredByUid: profile.referredByUid || ""
      });

      await setDoc(doc(db, "adminNotes", uid), { privateNote: note.privateNote || "" });

      setMessage("Сохранено.");
    } catch (err) {
      setMessage("Ошибка при сохранении: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Точно удалить бойца ${profile.callsign}?`)) return;
    await deleteDoc(doc(db, "profiles", uid));
    await deleteDoc(doc(db, "applications", uid));
    await deleteDoc(doc(db, "adminNotes", uid));
    navigate("/admin");
  }

  const gameRole = profile.gameRoles?.[activeGame] || defaultGameRole();
  const compColor = getCompositionColor(gameRole.composition);
  const posColor = getPositionColor(gameRole.position);
  const contacts = profile.extraContacts || {};

  return (
    <main className="container">
      <p><Link to="/admin">← Назад к списку</Link></p>
      <h1>Личное дело: {profile.callsign}</h1>

      {/* ---------- Анкета ---------- */}
      <div className="card">
        <div className="profile-block-title">Анкета</div>
        <h2>{profile.callsign}</h2>

        <DisciplinaryList actions={profile.globalDisciplinaryActions || []} showHistory={true} />

        <ProfileTable>
          <ProfileRow label="Email (виден только администрации)">{application.email}</ProfileRow>
          <ProfileRow label="Имя и фамилия">{application.fullName}</ProfileRow>
          <ProfileRow label="Возраст">{application.age}</ProfileRow>
          <ProfileRow label="Discord ID">{profile.discordId}</ProfileRow>
          <ProfileRow label="Steam ID"><CopyableField value={profile.steamId} /></ProfileRow>
          <ProfileRow label="Ссылка на Steam"><a href={profile.steamProfileUrl} target="_blank" rel="noreferrer">{profile.steamProfileUrl}</a></ProfileRow>
          {profile.armaId && <ProfileRow label="Arma ID"><CopyableField value={profile.armaId} /></ProfileRow>}
          <ProfileRow label="Часовой пояс">{profile.timezone}</ProfileRow>
          <ProfileRow label="Дата рождения">
            <PrivacyToggleField isPublic={profile.birthDatePublic} canToggle={true} onToggle={toggleBirthDatePublic}>
              {profile.birthDate || "—"}
            </PrivacyToggleField>
          </ProfileRow>
          <ProfileRow label="Дополнительные контакты">
            <PrivacyToggleField isPublic={profile.extraContactsPublic} canToggle={true} onToggle={toggleContactsPublic}>
              <span className="contacts-list">
                {contacts.phone && <span>{contacts.phone}</span>}
                {contacts.telegram && <a href={profile.telegramUrl} target="_blank" rel="noreferrer">Ссылка на Telegram: {contacts.telegram}</a>}
                {contacts.vk && <a href={profile.vkUrl} target="_blank" rel="noreferrer">Ссылка на ВКонтакте: {contacts.vk}</a>}
                {contacts.other && <span>{contacts.other}</span>}
                {!contacts.phone && !contacts.telegram && !contacts.vk && !contacts.other && "—"}
              </span>
            </PrivacyToggleField>
          </ProfileRow>
          {inviter && <ProfileRow label="Кем приглашён"><Link to={`/admin/player/${inviter.uid}`}>{inviter.callsign}</Link></ProfileRow>}
          {invitees.length > 0 && (
            <ProfileRow label="Кого пригласил">
              {invitees.map((inv, i) => <span key={inv.uid}>{i > 0 && ", "}<Link to={`/admin/player/${inv.uid}`}>{inv.callsign}</Link></span>)}
            </ProfileRow>
          )}
          <ProfileRow label="Доступность для игр">{application.availability}</ProfileRow>
          <ProfileRow label="Почему хочет вступить">{application.whyJoin}</ProfileRow>
          <ProfileRow label="Откуда узнал">
            {profile.referredByUid ? `Приглашён бойцом (см. выше)` : (application.howFound || "—")}
          </ProfileRow>
          {profile.gamesInterested.map(g => (
            <ProfileRow key={g} label={`Опыт в ${g}`}>
              {application.hoursByGame?.[g]} ч. — {application.experienceByGame?.[g]}
            </ProfileRow>
          ))}
        </ProfileTable>

        <p><b>Общие награды клана:</b></p>
        <div className="awards-list">
          {(profile.globalAwards || []).map((a, i) => (
            <div key={i} className="award-row">
              <AwardChip icon={a.icon} name={a.name} description={a.description} />
              <button className="btn secondary" onClick={() => removeGlobalAward(i)}>Изъять</button>
            </div>
          ))}
        </div>

        <Link to={`/admin/player/${uid}/edit`} className="btn secondary profile-edit-btn">Редактировать анкету</Link>

        <div style={{ marginTop: 16 }}>
          <label>Внутренняя заметка <span className="optional-tag">видна только администрации</span></label>
          <textarea value={note.privateNote || ""} onChange={e => setNote({ privateNote: e.target.value })} />
        </div>
      </div>

      {/* ---------- По игре ---------- */}
      <div className="card">
        <div className="profile-block-title">По игре</div>
        <div className="game-tabs">
          {GAMES.map(g => (
            <button key={g} type="button" className={`tab-btn ${activeGame === g ? "active" : ""}`} onClick={() => setActiveGame(g)}>{g}</button>
          ))}
        </div>

        <label>Публичная заметка — «Комбат о бойце»</label>
        <textarea value={profile.gameNotes?.[activeGame] || ""} onChange={e => updateGameNote(activeGame, e.target.value)} />

        <label>Состав</label>
        <select value={gameRole.composition} onChange={e => updateGameRole(activeGame, "composition", e.target.value)}>
          {COMPOSITIONS_ORDER.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <label>Должность</label>
        <select value={gameRole.position} onChange={e => updateGameRole(activeGame, "position", e.target.value)}>
          {POSITIONS_BY_COMPOSITION[gameRole.composition].map(pos => <option key={pos} value={pos}>{pos}</option>)}
        </select>
        {canBeSquadLeader(gameRole.composition) && (
          <ToggleSwitch checked={!!gameRole.isSquadLeader} onChange={e => updateGameRole(activeGame, "isSquadLeader", e.target.checked)} label="Командир отделения" />
        )}
        <p style={{ marginTop: 8 }}>
          Текущий цвет: <span className="badge" style={{ color: compColor, borderColor: compColor }}>{gameRole.composition}</span>{" "}
          <span className="badge" style={{ color: posColor, borderColor: posColor }}>{gameRole.position}</span>
        </p>

        <p><b>Боевые заслуги:</b></p>
        <div className="profile-stats-row">
          {["playedAsSoldierCount", "koCount", "ksCount"].map(field => {
            const labels = { playedAsSoldierCount: "отыграл как боец", koCount: "отыграл за КО", ksCount: "отыграл за КС" };
            const val = profile.gameStats?.[activeGame]?.[field] || 0;
            return (
              <div className="profile-stat-card" key={field}>
                <span className="stat-value">{val}</span>
                <span className="stat-label">{pluralize(val, TIMES_FORMS)} {labels[field]}</span>
                <div className="stat-counter-buttons">
                  <button type="button" className="icon-btn" onClick={() => adjustStat(activeGame, field, -1)} disabled={val <= 0}>−</button>
                  <button type="button" className="icon-btn" onClick={() => adjustStat(activeGame, field, 1)}>+</button>
                </div>
              </div>
            );
          })}
        </div>

        <p><b>Награды ({activeGame}):</b></p>
        {(profile.gameAwards?.[activeGame] || []).map((a, i) => (
          <div key={i} className="award-row">
            <AwardChip icon={a.icon} name={a.name} description={a.description} />
            <button className="btn secondary" onClick={() => removeGameAward(activeGame, i)}>Изъять</button>
          </div>
        ))}

        <label style={{ marginTop: 16 }}>Выдать награду</label>
        <select value={awardScope} onChange={e => setAwardScope(e.target.value)}>
          <option value="game">Только для {activeGame}</option>
          <option value="global">Общая для всего клана</option>
        </select>
        <input type="text" placeholder="Иконка награды (эмодзи)" value={awardIcon} onChange={e => setAwardIcon(e.target.value)} />
        <input type="text" placeholder="Короткое название" value={awardName} onChange={e => setAwardName(e.target.value)} />
        <textarea placeholder="Развёрнутое описание — за что дана награда" value={awardDescription} onChange={e => setAwardDescription(e.target.value)} />
        <button className="btn secondary" onClick={giveAward}>Выдать награду</button>

        <p style={{ marginTop: 20 }}><b>Дисциплинарные взыскания ({activeGame}):</b></p>
        <DisciplinaryList actions={profile.gameDisciplinaryActions?.[activeGame] || []} showHistory={true} />

        <label>Выдать взыскание</label>
        <select value={actionScope} onChange={e => setActionScope(e.target.value)}>
          <option value="game">Только для {activeGame}</option>
          <option value="global">Общее для всего клана</option>
        </select>
        <select value={actionType} onChange={e => setActionType(e.target.value)}>
          <option value="Замечание">Замечание (1 месяц)</option>
          <option value="Выговор">Выговор (3 месяца)</option>
        </select>
        <textarea value={actionReason} onChange={e => setActionReason(e.target.value)} placeholder="Причина" />
        <button className="btn secondary" onClick={issueAction}>Выдать взыскание</button>
        {disciplineError && <div className="error">{disciplineError}</div>}
      </div>

      <div className="save-actions">
        <button className="btn btn-large" onClick={saveAll} disabled={saving}>{saving ? "Сохранение..." : "Сохранить все изменения"}</button>
        {message && <p className="hint">{message}</p>}
      </div>

      <div className="card danger-zone">
        <h2>Технический раздел</h2>
        <button className="btn danger" onClick={handleDelete}>Удалить бойца из базы данных</button>
      </div>
    </main>
  );
}
