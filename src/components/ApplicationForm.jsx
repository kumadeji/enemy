import { useState } from "react";
import { Link } from "react-router-dom";
import { TIMEZONES } from "../data/timezones";
import ImageHint from "./ImageHint";

const BANNED_WORDS = ["qwe", "abracadabra", "xxx"];
export const ALL_GAMES = ["Arma Reforger", "Squad"];

export function validateCallsign(value) {
  const trimmed = value.trim();
  const words = trimmed.split(/\s+/);

  if (words.length > 2) return "Позывной не должен состоять больше чем из 2 слов.";
  if (trimmed.length < 3 || trimmed.length > 24) return "Длина позывного должна быть от 3 до 24 символов.";

  // Кириллица больше не допускается — только латиница, цифры и символы - _ .
  const allowedPattern = /^[A-Za-z0-9\-_. ]+$/;
  if (!allowedPattern.test(trimmed)) return "Допустимы только латинские буквы, цифры и символы - _ . Кириллица не допускается.";

  for (const word of words) {
    if (/[a-z][A-Z]/.test(word)) {
      return "Нельзя чередовать регистр букв внутри слова (например, StOrM). Допустимо: обычный регистр (Stormbreaker) или слово целиком заглавными буквами (STORM).";
    }
  }

  const lower = trimmed.toLowerCase();
  if (BANNED_WORDS.some(w => lower.includes(w))) {
    return "Позывной похож на бессмысленный набор символов — выберите другой.";
  }
  if (/\(|\)|"|'/.test(trimmed)) {
    return "Не используйте скобки, кавычки или реальные имена через разделители.";
  }
  return null;
}

export function buildSteamProfileUrl(steamId) {
  const trimmed = (steamId || "").trim();
  if (!trimmed) return "";
  return `https://steamcommunity.com/profiles/${trimmed}/`;
}

const emptyValues = {
  email: "", password: "", fullName: "", age: "", birthDate: "",
  steamId: "", discordId: "", armaId: "",
  extraPhone: "", extraTelegram: "", extraVk: "", extraOther: "",
  callsign: "", timezone: "", availability: "",
  whyJoin: "", howFound: "", charterAgreed: false,
  games: [], gameDetails: {}
};

export default function ApplicationForm({
  initialValues,
  onSubmit,
  submitLabel = "Отправить",
  showAccountFields = true,
  lockedFields = [],
  submitting = false,
  externalError = ""
}) {
  const [form, setForm] = useState({ ...emptyValues, ...initialValues });
  const [callsignError, setCallsignError] = useState("");
  const [formError, setFormError] = useState("");

  const isLocked = (field) => lockedFields.includes(field);

  function updateField(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function toggleGame(game) {
    setForm(prev => {
      const games = prev.games.includes(game)
        ? prev.games.filter(g => g !== game)
        : [...prev.games, game];
      const gameDetails = { ...prev.gameDetails };
      if (!gameDetails[game]) gameDetails[game] = { hours: "", experience: "" };
      return { ...prev, games, gameDetails };
    });
  }

  function updateGameDetail(game, field, value) {
    setForm(prev => ({
      ...prev,
      gameDetails: { ...prev.gameDetails, [game]: { ...prev.gameDetails[game], [field]: value } }
    }));
  }

  const steamProfileUrl = buildSteamProfileUrl(form.steamId);

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");

    if (showAccountFields) {
      if (!form.email.trim()) { setFormError("Укажите email."); return; }
      if (!form.password || form.password.length < 6) { setFormError("Пароль должен быть не короче 6 символов."); return; }
    }

    const age = Number(form.age);
    if (!age || age < 16) { setFormError("В клан принимаются лица старше 16 лет."); return; }
    if (form.games.length === 0) { setFormError("Выберите хотя бы одну игру."); return; }
    if (form.games.includes("Arma Reforger") && !form.armaId.trim()) {
      setFormError("Укажите Arma ID — это обязательно для направления Arma Reforger.");
      return;
    }
    if (!form.discordId.trim()) { setFormError("Укажите Discord ID."); return; }
    if (!form.steamId.trim()) { setFormError("Укажите Steam ID."); return; }
    if (!form.timezone) { setFormError("Выберите часовой пояс."); return; }
    if (!form.availability.trim()) { setFormError("Укажите доступность для игр."); return; }
    if (!form.whyJoin.trim()) { setFormError("Расскажите, почему хотите вступить."); return; }
    if (!form.howFound.trim()) { setFormError("Укажите, откуда узнали о клане."); return; }
    if (!form.charterAgreed) { setFormError("Нужно подтвердить, что вы ознакомились с уставом и манифестом."); return; }

    const cErr = validateCallsign(form.callsign);
    if (cErr && !isLocked("callsign")) { setCallsignError(cErr); setFormError(cErr); return; }

    for (const g of form.games) {
      if (!form.gameDetails[g]?.hours || !form.gameDetails[g]?.experience?.trim()) {
        setFormError(`Заполните часы и опыт игры для ${g}.`);
        return;
      }
    }

    await onSubmit({ ...form, steamProfileUrl });
  }

  return (
    <form className="apply-form" onSubmit={handleSubmit}>

      {showAccountFields && (
        <fieldset className="form-section">
          <legend>Аккаунт на сайте</legend>
          <label>Электронная почта</label>
          <input type="email" required value={form.email} onChange={e => updateField("email", e.target.value)} />
          <div className="field-hint">Используется в качестве логина для входа на сайт, а также для связи администрации с вами.</div>

          <label>Пароль</label>
          <input type="password" minLength={6} required value={form.password} onChange={e => updateField("password", e.target.value)} />
          <div className="field-hint">
            Хранится в зашифрованном виде. <b>Восстановление пароля на сайте не предусмотрено.</b> Не теряйте его —
            при утере обратитесь к администрации для сброса аккаунта.
          </div>
        </fieldset>
      )}

      <fieldset className="form-section">
        <legend>Личные данные</legend>

        <label>Имя и фамилия</label>
        <input type="text" required value={form.fullName} onChange={e => updateField("fullName", e.target.value)} />

        <label>Возраст</label>
        <input type="number" min={16} required value={form.age} onChange={e => updateField("age", e.target.value)} />
        <div className="field-hint">В клан принимаются лица старше 16 лет.</div>

        <label>Дата рождения <span className="optional-tag">необязательно</span></label>
        <input type="date" value={form.birthDate} onChange={e => updateField("birthDate", e.target.value)} />
        <div className="field-hint">Нужна только для того, чтобы мы могли поздравить вас в клане с днём рождения. Можно заполнить позже, в любое время.</div>
      </fieldset>

      <fieldset className="form-section">
        <legend>Контакты</legend>

        <label>Steam ID
          <ImageHint image="/hints/steam-id.png" alt="Где взять Steam ID" />
        </label>
        <input type="text" required value={form.steamId} onChange={e => updateField("steamId", e.target.value)} />
        {steamProfileUrl && (
          <div className="field-hint">
            Ссылка на профиль: <a href={steamProfileUrl} target="_blank" rel="noreferrer">{steamProfileUrl}</a>
            {" "}— откройте и убедитесь, что это ваш профиль и он публичный.
          </div>
        )}

        <label>Discord ID
          <ImageHint image="/hints/discord-id.png" alt="Где взять Discord ID" />
        </label>
        <input type="text" required value={form.discordId} onChange={e => updateField("discordId", e.target.value)} />
        <div className="field-hint">Нужен для поддержания связи в клане — коммуникация идёт через Discord.</div>

        {form.games.includes("Arma Reforger") && (
          <>
            <label>Arma ID
              <ImageHint image="/hints/arma-id.png" alt="Где взять Arma ID" />
            </label>
            <input type="text" required value={form.armaId} onChange={e => updateField("armaId", e.target.value)} />
          </>
        )}

        <label>Дополнительные контакты <span className="optional-tag">необязательно</span></label>
        <div className="extra-contacts-grid">
          <input type="text" placeholder="Номер телефона" value={form.extraPhone} onChange={e => updateField("extraPhone", e.target.value)} />
          <input type="text" placeholder="Логин Telegram" value={form.extraTelegram} onChange={e => updateField("extraTelegram", e.target.value)} />
          <input type="text" placeholder="Логин ВКонтакте" value={form.extraVk} onChange={e => updateField("extraVk", e.target.value)} />
          <input type="text" placeholder="Любой другой контакт" value={form.extraOther} onChange={e => updateField("extraOther", e.target.value)} />
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend>Позывной</legend>
        <label>Укажите ваш позывной</label>
        <input type="text" required value={form.callsign} disabled={isLocked("callsign")}
          onChange={e => updateField("callsign", e.target.value)}
          onBlur={e => setCallsignError(validateCallsign(e.target.value) || "")} />
        {isLocked("callsign") && <div className="field-hint">Смена позывного возможна только через администрацию клана.</div>}

        <div className="callsign-rules">
          <p><b>Позывной указывается один раз и навсегда</b>, смена — только через администрацию.</p>
          <ul>
            <li>✅ <b>Формат:</b> только латиница, цифры и символы (-, _, .). Кириллица не допускается.</li>
            <li>👁 <b>Читаемость:</b> легко считывается визуально и на слух. Чередование регистра (СтОрМ) запрещено — допустим обычный регистр (Stormbreaker) или ВСЕ ЗАГЛАВНЫЕ (STORM).</li>
            <li>⚖️ <b>Содержание:</b> без оскорблений, дискриминации и провокаций.</li>
          </ul>
          <p>🚫 <b>Запрещено:</b> реальные имена (Alexander, Dmitry), имена в скобках (Wolf_Ivan), бессмысленные наборы (qwe123), больше 2 слов.</p>
          <p>📌 <b>Примеры:</b> Stormbreaker, Ghost, Falcon, STORM.</p>
        </div>
        {callsignError && <div className="error">{callsignError}</div>}
      </fieldset>

      <fieldset className="form-section">
        <legend>Игровой опыт</legend>
        <label>В какие игры планируете играть?</label>
        <div className="checkbox-row">
          {ALL_GAMES.map(game => (
            <label key={game} className="checkbox-label">
              <input type="checkbox" checked={form.games.includes(game)} onChange={() => toggleGame(game)} />
              <span>{game}</span>
            </label>
          ))}
        </div>

        {form.games.map(game => (
          <div key={game} className="game-detail-block">
            <label>Сколько часов наиграно в {game}?</label>
            <input type="number" min={0} required
              value={form.gameDetails[game]?.hours || ""}
              onChange={e => updateGameDetail(game, "hours", e.target.value)} />
            <label>Опыт игры в {game}</label>
            <textarea required value={form.gameDetails[game]?.experience || ""}
              onChange={e => updateGameDetail(game, "experience", e.target.value)} />
          </div>
        ))}
      </fieldset>

      <fieldset className="form-section">
        <legend>Доступность для игр</legend>
        <label>Часовой пояс</label>
        <select required value={form.timezone} onChange={e => updateField("timezone", e.target.value)}>
          <option value="">Выберите часовой пояс</option>
          {TIMEZONES.map(tz => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
        </select>

        <label>Когда вы обычно свободны для игр?</label>
        <textarea required value={form.availability} onChange={e => updateField("availability", e.target.value)} />
        <div className="field-hint">Укажите по каким дням, в какие часы по вашему часовому поясу.</div>
      </fieldset>

      <fieldset className="form-section">
        <legend>О вас</legend>
        <label>Почему хотите вступить в клан?</label>
        <textarea required value={form.whyJoin} onChange={e => updateField("whyJoin", e.target.value)} />

        <label>Откуда узнали о клане?</label>
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
        {submitting ? "Сохранение..." : submitLabel}
      </button>
      {(formError || externalError) && <div className="error">{formError || externalError}</div>}
    </form>
  );
}
