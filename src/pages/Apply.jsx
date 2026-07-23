import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth, db, GOOGLE_SHEETS_URL } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, runTransaction, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";

const BANNED_WORDS = ["qwe", "abracadabra", "xxx"];
const ALL_GAMES = ["Arma Reforger", "DayZ", "Squad"];

function validateCallsign(value) {
  const trimmed = value.trim();
  const words = trimmed.split(/\s+/);
  if (words.length > 2) return "Позывной не должен состоять больше чем из 2 слов.";
  if (trimmed.length < 3 || trimmed.length > 24) return "Длина позывного должна быть от 3 до 24 символов.";
  const allowedPattern = /^[A-Za-zА-Яа-яЁё0-9\-_. ]+$/;
  if (!allowedPattern.test(trimmed)) return "Допустимы только латиница, кириллица, цифры и символы - _ .";
  for (const word of words) {
    if (/\B[A-ZА-ЯЁ]/.test(word)) return "Избегайте заглавных букв в середине слова.";
  }
  const lower = trimmed.toLowerCase();
  if (BANNED_WORDS.some(w => lower.includes(w))) return "Позывной похож на бессмысленный набор символов — выберите другой.";
  if (/\(|\)|"|'/.test(trimmed)) return "Не используйте скобки и кавычки в позывном.";
  return null;
}

export default function Apply() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "", password: "", fullName: "", age: "",
    steamUrl: "", discordTag: "", extraContacts: "",
    callsign: "", timezone: "", availability: "",
    whyJoin: "", howFound: "", charterAgreed: false
  });
  const [games, setGames] = useState([]);
  const [gameDetails, setGameDetails] = useState({});
  const [callsignError, setCallsignError] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (currentUser) {
    return (
      <main className="container">
        <p className="hint">Вы уже зарегистрированы. <Link to="/profile">Перейти в профиль</Link>.</p>
      </main>
    );
  }

  function updateField(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function toggleGame(game) {
    setGames(prev => prev.includes(game) ? prev.filter(g => g !== game) : [...prev, game]);
    setGameDetails(prev => prev[game] ? prev : { ...prev, [game]: { hours: "", experience: "" } });
  }

  function updateGameDetail(game, field, value) {
    setGameDetails(prev => ({ ...prev, [game]: { ...prev[game], [field]: value } }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");

    const age = Number(form.age);
    if (age < 16) { setFormError("В клан принимаются лица старше 16 лет."); return; }
    if (games.length === 0) { setFormError("Выберите хотя бы одну игру."); return; }

    const callsignErr = validateCallsign(form.callsign);
    if (callsignErr) { setFormError(callsignErr); return; }
    if (!form.charterAgreed) { setFormError("Нужно подтвердить, что вы ознакомились с уставом."); return; }

    setSubmitting(true);

    const hoursByGame = {};
    const experienceByGame = {};
    games.forEach(g => {
      hoursByGame[g] = Number(gameDetails[g]?.hours || 0);
      experienceByGame[g] = gameDetails[g]?.experience || "";
    });

    try {
      const callsignKey = form.callsign.trim().toLowerCase();
      const callsignRef = doc(db, "callsigns", callsignKey);

      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const uid = cred.user.uid;

      await runTransaction(db, async (tx) => {
        const existing = await tx.get(callsignRef);
        if (existing.exists()) throw new Error("Этот позывной уже занят, выберите другой.");
        tx.set(callsignRef, { uid });

        tx.set(doc(db, "profiles", uid), {
          callsign: form.callsign.trim(), discordTag: form.discordTag, extraContacts: form.extraContacts,
          steamUrl: form.steamUrl, gamesInterested: games,
          status: "Новобранец", awards: [],
          createdAt: serverTimestamp()
        });

        tx.set(doc(db, "applications", uid), {
          email: form.email, fullName: form.fullName, age,
          steamUrl: form.steamUrl, discordTag: form.discordTag, extraContacts: form.extraContacts,
          hoursByGame, experienceByGame, timezone: form.timezone, availability: form.availability,
          whyJoin: form.whyJoin, howFound: form.howFound, charterAgreed: form.charterAgreed,
          createdAt: serverTimestamp()
        });
      });

      if (GOOGLE_SHEETS_URL) {
        fetch(GOOGLE_SHEETS_URL, {
          method: "POST",
          body: JSON.stringify({
            callsign: form.callsign, email: form.email, fullName: form.fullName, age,
            steamUrl: form.steamUrl, discordTag: form.discordTag, extraContacts: form.extraContacts,
            gamesInterested: games, timezone: form.timezone, availability: form.availability,
            whyJoin: form.whyJoin, howFound: form.howFound, charterAgreed: form.charterAgreed
          })
        }).catch(() => {});
      }

      navigate("/profile");
    } catch (err) {
      setFormError(err.message || "Ошибка при регистрации.");
      setSubmitting(false);
    }
  }

  return (
    <main className="container">
      <h1>Заявка на вступление</h1>
      <form className="card" onSubmit={handleSubmit}>

        <label>Электронная почта (логин)</label>
        <input type="email" required value={form.email} onChange={e => updateField("email", e.target.value)} />

        <label>Пароль</label>
        <input type="password" minLength={6} required value={form.password} onChange={e => updateField("password", e.target.value)} />
        <div className="hint">Минимум 6 символов. Хранится в зашифрованном виде.</div>

        <label>Имя и фамилия</label>
        <input type="text" required value={form.fullName} onChange={e => updateField("fullName", e.target.value)} />

        <label>Возраст</label>
        <input type="number" min={16} required value={form.age} onChange={e => updateField("age", e.target.value)} />
        <div className="hint">В клан принимаются лица старше 16 лет.</div>

        <label>Ссылка на профиль Steam</label>
        <input type="url" required placeholder="https://steamcommunity.com/id/..." value={form.steamUrl} onChange={e => updateField("steamUrl", e.target.value)} />

        <label>Никнейм в Discord</label>
        <input type="text" required value={form.discordTag} onChange={e => updateField("discordTag", e.target.value)} />

        <label>Дополнительные контакты (необязательно)</label>
        <input type="text" value={form.extraContacts} onChange={e => updateField("extraContacts", e.target.value)} />

        <label>Позывной</label>
        <input type="text" required value={form.callsign}
          onChange={e => updateField("callsign", e.target.value)}
          onBlur={e => setCallsignError(validateCallsign(e.target.value) || "")} />
        <div className="hint">
          Указывается один раз и навсегда. Латиница/кириллица/цифры/символы «- _ .», максимум 2 слова.
        </div>
        {callsignError && <div className="error">{callsignError}</div>}

        <label>В какие игры планируете играть?</label>
        {ALL_GAMES.map(game => (
          <label key={game}>
            <input type="checkbox" checked={games.includes(game)} onChange={() => toggleGame(game)} /> {game}
          </label>
        ))}

        {games.map(game => (
          <div key={game}>
            <label>Сколько часов наиграно в {game}?</label>
            <input type="number" min={0} required
              value={gameDetails[game]?.hours || ""}
              onChange={e => updateGameDetail(game, "hours", e.target.value)} />
            <label>Расскажите об опыте игры в {game}</label>
            <textarea required value={gameDetails[game]?.experience || ""}
              onChange={e => updateGameDetail(game, "experience", e.target.value)} />
          </div>
        ))}

        <label>Часовой пояс (UTC)</label>
        <input type="text" required placeholder="например, UTC+3" value={form.timezone} onChange={e => updateField("timezone", e.target.value)} />

        <label>Когда вы обычно свободны для игр?</label>
        <textarea required value={form.availability} onChange={e => updateField("availability", e.target.value)} />

        <label>Почему хотите вступить в клан?</label>
        <textarea required value={form.whyJoin} onChange={e => updateField("whyJoin", e.target.value)} />

        <label>Откуда узнали о клане?</label>
        <textarea required value={form.howFound} onChange={e => updateField("howFound", e.target.value)} />

        <label>
          <input type="checkbox" required checked={form.charterAgreed} onChange={e => updateField("charterAgreed", e.target.checked)} />
          {" "}Ознакомился(ась) с <Link to="/charter" target="_blank">уставом и манифестом клана</Link>
        </label>

        <button type="submit" className="btn" disabled={submitting}>
          {submitting ? "Отправка..." : "Отправить заявку"}
        </button>
        {formError && <div className="error">{formError}</div>}
      </form>
    </main>
  );
}
