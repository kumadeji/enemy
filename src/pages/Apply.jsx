import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth, db, GOOGLE_SHEETS_URL } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, runTransaction, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";

const ALL_GAMES = ["Arma Reforger", "Squad"];

function validateCallsign(value) {
  const trimmed = value.trim();
  const words = trimmed.split(/\s+/);

  if (words.length > 2) return "Позывной не должен состоять больше чем из 2 слов.";
  if (trimmed.length < 3 || trimmed.length > 24) return "Длина позывного должна быть от 3 до 24 символов.";

  const allowedPattern = /^[A-Za-zА-Яа-яЁё0-9\-_. ]+$/;
  if (!allowedPattern.test(trimmed)) return "Допустимы только латиница, кириллица, цифры и символы - _ .";

  // Запрещаем чередование регистра внутри слова (например, StOrM),
  // но разрешаем слово ПОЛНОСТЬЮ заглавными буквами (например, STORM),
  // а также обычный формат "Первая заглавная, остальные строчные" (Stormbreaker).
  for (const word of words) {
    if (/[a-zа-яё][A-ZА-ЯЁ]/.test(word)) {
      return "Нельзя чередовать регистр букв внутри слова (например, sToRm). Допускается обычный регистр (Stormbreaker) или слово целиком заглавными буквами (STORM).";
    }
  }

  if (/\(|\)|"|'/.test(trimmed)) {
    return "Не используйте скобки, кавычки и другие недопустимые символы.";
  }

  return null;
}


export default function Apply() {
  const { currentUser, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [wasLoggedInOnLoad] = useState(() => !!currentUser);

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

  if (wasLoggedInOnLoad) {
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
    if (!form.charterAgreed) { setFormError("Нужно подтвердить, что вы ознакомились с уставом и манифестом."); return; }

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

      // Критически важная строка: перечитываем профиль в контексте авторизации,
      // чтобы избежать бага с "неизвестным" статусом сразу после регистрации.
      await refreshProfile();

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

      navigate("/"); // теперь редирект на главную, как просили
    } catch (err) {
      setFormError(err.message || "Ошибка при регистрации.");
      setSubmitting(false);
    }
  }

  return (
    <main className="container">
      <h1>Заявка на вступление</h1>
      <p className="page-lead">
        Мультиигровое сообщество <b>ENEMY</b>. Приём заявок в настоящий момент открыт
        для закрытого направления по игре <b>Arma Reforger</b>. После заполнения анкеты
        она поступит на рассмотрение администрации.
      </p>

      <form className="apply-form" onSubmit={handleSubmit}>

        <fieldset className="form-section">
          <legend>Аккаунт на сайте</legend>

          <label>Электронная почта</label>
          <input type="email" required value={form.email} onChange={e => updateField("email", e.target.value)} />
          <div className="field-hint">Используется в качестве логина для входа на сайт, а также для связи администрации с вами.</div>

          <label>Пароль</label>
          <input type="password" minLength={6} required value={form.password} onChange={e => updateField("password", e.target.value)} />
          <div className="field-hint">
            Хранится в зашифрованном виде — никто, включая администрацию, не может его увидеть.
            <br />
            <b>Восстановление пароля на сайте не предусмотрено.</b> Пожалуйста, не теряйте его.
            Если это всё же произошло — обратитесь к администрации для сброса аккаунта.
          </div>
        </fieldset>

        <fieldset className="form-section">
          <legend>Личные данные</legend>

          <label>Имя и фамилия</label>
          <input type="text" required value={form.fullName} onChange={e => updateField("fullName", e.target.value)} />
          <div className="field-hint">Укажите ваши настоящие имя и фамилию.</div>

          <label>Возраст</label>
          <input type="number" min={16} required value={form.age} onChange={e => updateField("age", e.target.value)} />
          <div className="field-hint">Учтите, что в клан принимаются лица старше 16 лет.</div>
        </fieldset>

        <fieldset className="form-section">
          <legend>Контакты</legend>

          <label>Ссылка на профиль Steam</label>
          <input type="url" required placeholder="https://steamcommunity.com/id/..." value={form.steamUrl} onChange={e => updateField("steamUrl", e.target.value)} />
          <div className="field-hint">
            Это необходимо для верификации вашего опыта. Ваш профиль Steam и данные об играх
            должны быть публичными, а интересуемая игра — Arma Reforger — должна быть видна в профиле.
          </div>

          <label>Никнейм в Discord</label>
          <input type="text" required value={form.discordTag} onChange={e => updateField("discordTag", e.target.value)} />
          <div className="field-hint">Это необходимо для поддержания связи в клане — коммуникация будет именно через него.</div>

          <label>Дополнительные контакты</label>
          <input type="text" value={form.extraContacts} onChange={e => updateField("extraContacts", e.target.value)} />
          <div className="field-hint">Опциональный, но желательный для заполнения пункт.</div>
        </fieldset>

        <fieldset className="form-section">
          <legend>Позывной</legend>

          <label>Укажите ваш позывной</label>
          <input type="text" required value={form.callsign}
            onChange={e => updateField("callsign", e.target.value)}
            onBlur={e => setCallsignError(validateCallsign(e.target.value) || "")} />
          <div className="field-hint">Позывной должен быть ёмким и понятным, удобным для запоминания и произношения в ходе игры.</div>

          <div className="callsign-rules">
            <p><b>Обратите внимание: позывной указывается один раз и навсегда</b>, смена позывного
            происходит только в исключительных случаях при согласовании с администрацией.</p>
            <ul>
              <li>Может состоят из латиницы, кириллицы, цифр и общепринятых символов (-, _, .).</li>
              <li>Должен легко считываться визуально и на слух. Избегайте сложных сочетаний, повторов и заглавных букв в середине слов.</li>
              <li>Не должен содержать оскорблений, дискриминации, провокаций или нарушать законодательство России и других государств.</li>
            </ul>
            <p>🚫 <b>Запрещено:</b></p>
            <ul>
              <li>Реальные имена, фамилии и их производные (в т. ч. в транслите): <i>Александр, Серёга, Dmitry</i>.</li>
              <li>Указание имён в скобках, кавычках или через разделители: <i>BURBON (Серёга), Wolf_Ivan</i>.</li>
              <li>Бессмысленные наборы символов («абракадабра»): <i>qwe123, кщгшз, xXx_Dark_xXx</i>.</li>
			  <li>Чередование регистра букв: <i>sToRm, АнДрюХа228</i>.</li>
              <li>Позывные из трёх и более слов (максимум 2 слова).</li>
            </ul>
            <p>📌 <b>Примеры корректных позывных:</b> <i>Stormbreaker, Волчара, Фантом</i>.</p>
          </div>
          {callsignError && <div className="error">{callsignError}</div>}
        </fieldset>

        <fieldset className="form-section">
          <legend>Игровой опыт</legend>

          <label>Укажите, в какие игры в клане вы планировали бы играть?</label>
          <div className="checkbox-row">
            {ALL_GAMES.map(game => (
              <label key={game} className="checkbox-label">
                <input type="checkbox" checked={games.includes(game)} onChange={() => toggleGame(game)} />
                <span>{game}</span>
              </label>
            ))}
          </div>

          {games.map(game => (
            <div key={game} className="game-detail-block">
              <label>Сколько часов в общей сложности вы наиграли в {game}?</label>
              <input type="number" min={0} required
                value={gameDetails[game]?.hours || ""}
                onChange={e => updateGameDetail(game, "hours", e.target.value)} />

              <label>Расскажите подробнее о вашем опыте игры в {game}</label>
              <textarea required value={gameDetails[game]?.experience || ""}
                onChange={e => updateGameDetail(game, "experience", e.target.value)} />
            </div>
          ))}
        </fieldset>

        <fieldset className="form-section">
          <legend>Доступность для игр</legend>

          <label>Укажите свой часовой пояс</label>
          <input type="text" required placeholder="Например, UTC+3 для Москвы" value={form.timezone} onChange={e => updateField("timezone", e.target.value)} />
          <div className="field-hint">Формат: UTC.</div>

          <label>В какое время вы обычно свободны для игр?</label>
          <textarea required value={form.availability} onChange={e => updateField("availability", e.target.value)} />
          <div className="field-hint">Укажите по каким дням, в какие часы по вашему часовому поясу.</div>
        </fieldset>

        <fieldset className="form-section">
          <legend>О вас</legend>

          <label>Почему вы бы хотели, чтобы мы вас приняли в клан?</label>
          <textarea required value={form.whyJoin} onChange={e => updateField("whyJoin", e.target.value)} />

          <label>Откуда узнали о клане и почему выбрали именно его?</label>
          <textarea required value={form.howFound} onChange={e => updateField("howFound", e.target.value)} />
        </fieldset>

        <fieldset className="form-section">
          <legend>Подтверждение</legend>
          <label className="checkbox-label">
            <input type="checkbox" required checked={form.charterAgreed} onChange={e => updateField("charterAgreed", e.target.checked)} />
            <span>Ознакомился(ась) с <Link to="/charter" target="_blank">уставом и манифестом клана</Link></span>
          </label>
        </fieldset>

        <button type="submit" className="btn btn-large" disabled={submitting}>
          {submitting ? "Отправка..." : "Отправить заявку"}
        </button>
        {formError && <div className="error">{formError}</div>}
      </form>
    </main>
  );
}
