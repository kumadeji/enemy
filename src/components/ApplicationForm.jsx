import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { TIMEZONES } from "../data/timezones";
import ImageHint from "./ImageHint";
import { formatBirthDateInput, validateBirthDate } from "../utils/birthDate";
import { buildTelegramUrl, buildVkUrl } from "../utils/socialLinks";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { sendYandexGoal } from "../utils/yandexMetrica";

export const ALL_GAMES = ["Arma Reforger", "Squad"];

export function validateCallsign(value) {
  const trimmed = value.trim();
  const words = trimmed.split(/\s+/);
  if (words.length > 2) return "Позывной не должен состоять больше чем из 2 слов.";
  if (trimmed.length < 3 || trimmed.length > 24) return "Длина позывного должна быть от 3 до 24 символов.";
  const allowedPattern = /^[A-Za-z0-9\-_. ]+$/;
  if (!allowedPattern.test(trimmed)) return "Допустимы только латинские буквы, цифры и символы '-', '_'. Кириллица не допускается.";
  if (/\(|\)|"|'/.test(trimmed)) return "Не используйте скобки, кавычки или разделители.";
  return null;
}

export function buildSteamProfileUrl(steamId) {
  const trimmed = (steamId || "").trim();
  if (!trimmed) return "";
  return `https://steamcommunity.com/profiles/${trimmed}/`;
}

function validatePhone(value) {
  if (!value.trim()) return null;
  if (!/^\+\d{7,15}$/.test(value.trim())) return "Телефон не прошёл проверку: он должен быть в формате +<код страны и номер целиком>, например +79991234567.";
  return null;
}

function validateHandle(value, fieldName) {
  if (!value.trim()) return null;
  if (/\s/.test(value)) return `${fieldName}: пробелы не допускаются.`;
  if (value.includes("@")) return `${fieldName}: указывайте без символа @.`;
  return null;
}

function validateSteamId(value) {
  if (!value.trim()) return null;
  if (!/^\d+$/.test(value.trim())) return "Steam ID не прошёл проверку: он должен состоять только из цифр (это не ссылка и не имя профиля). Где его взять — в подсказке выше.";
  return null;
}

function validateArmaId(value) {
  if (!value.trim()) return null;
  if (!value.includes("-")) return "Arma ID не прошёл проверку: укажите правильный Arma ID. Где его взять — в подсказке выше.";
  return null;
}

const emptyValues = {
  email: "", password: "", fullName: "", age: "", birthDate: "",
  steamId: "", discordId: "", armaId: "",
  extraPhone: "", extraTelegram: "", extraVk: "", extraOther: "",
  callsign: "", timezone: "", availability: "",
  whyJoin: "", howFound: "", referredByUid: "", charterAgreed: false,
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
  const [birthDateError, setBirthDateError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [telegramError, setTelegramError] = useState("");
  const [vkError, setVkError] = useState("");
  const [steamIdError, setSteamIdError] = useState("");
  const [armaIdError, setArmaIdError] = useState("");
  const [formError, setFormError] = useState("");

  // По умолчанию — "меня пригласил игрок с сайта", как и просили
  const [referralType, setReferralType] = useState(
    initialValues && !initialValues.referredByUid && initialValues.howFound ? "text" : "player"
  );
  const [rosterList, setRosterList] = useState([]);

  useEffect(() => {
    async function loadRoster() {
      const snap = await getDocs(collection(db, "rosterPublic"));
      const list = snap.docs.map(d => ({ uid: d.id, ...d.data() })).filter(p => p.callsign);
      list.sort((a, b) => a.callsign.localeCompare(b.callsign, "ru"));
      setRosterList(list);
    }
    loadRoster();
  }, []);

  const isLocked = (field) => lockedFields.includes(field);

  function updateField(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function toggleGame(game) {
    setForm(prev => {
      const games = prev.games.includes(game) ? prev.games.filter(g => g !== game) : [...prev.games, game];
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
  const telegramUrl = buildTelegramUrl(form.extraTelegram);
  const vkUrl = buildVkUrl(form.extraVk);

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");

    if (showAccountFields) {
      if (!form.email.trim()) { setFormError("Укажите электронную почту."); return; }
      if (!form.password || form.password.length < 6) { setFormError("Пароль должен быть не короче 6 символов."); return; }
    }

    const age = Number(form.age);
    if (!age || age < 16 || age > 99) { setFormError("В клан принимаются лица только старше 16 лет."); return; }

    const bErr = validateBirthDate(form.birthDate);
    if (bErr) { setBirthDateError(bErr); setFormError(bErr); return; }

    const pErr = validatePhone(form.extraPhone);
    if (pErr) { setPhoneError(pErr); setFormError(pErr); return; }

    const tErr = validateHandle(form.extraTelegram, "Telegram");
    if (tErr) { setTelegramError(tErr); setFormError(tErr); return; }

    const vErr = validateHandle(form.extraVk, "ВКонтакте");
    if (vErr) { setVkError(vErr); setFormError(vErr); return; }

    if (form.games.length === 0) { setFormError("Выберите хотя бы одну игру."); return; }
    if (form.games.includes("Arma Reforger")) {
      if (!form.armaId.trim()) {
        setFormError("Укажите Arma ID — это обязательно для направления Arma Reforger.");
        return;
      }
      const armaErr = validateArmaId(form.armaId);
      if (armaErr) { setArmaIdError(armaErr); setFormError(armaErr); return; }
    }
	
    if (!form.discordId.trim()) { setFormError("Укажите Discord ID."); return; }
    if (!form.steamId.trim()) { setFormError("Укажите Steam ID."); return; }
    const steamErr = validateSteamId(form.steamId);
    if (steamErr) { setSteamIdError(steamErr); setFormError(steamErr); return; }

    if (!form.timezone) { setFormError("Выберите часовой пояс."); return; }
    if (!form.availability.trim()) { setFormError("Укажите доступность для игр."); return; }
    if (!form.whyJoin.trim()) { setFormError("Расскажите, почему хотите вступить."); return; }

    if (referralType === "player" && !form.referredByUid) {
      setFormError("Выберите бойца, который вас пригласил.");
      return;
    }
    if (referralType === "text" && !form.howFound.trim()) {
      setFormError("Укажите в свободной форме, откуда узнали о клане.");
      return;
    }

    if (!form.charterAgreed) { setFormError("Нужно подтвердить, что вы ознакомились с уставом и манифестом."); return; }

    const cErr = validateCallsign(form.callsign);
    if (cErr && !isLocked("callsign")) { setCallsignError(cErr); setFormError(cErr); return; }

    for (const g of form.games) {
      if (!form.gameDetails[g]?.hours || !form.gameDetails[g]?.experience?.trim()) {
        setFormError(`Заполните часы и опыт игры для ${g}.`);
        return;
      }
    }

    const referrerCallsign = referralType === "player"
      ? rosterList.find(p => p.uid === form.referredByUid)?.callsign || ""
      : "";

    // ✅ ИСПРАВЛЕНО: Сначала сохраняем, потом отправляем цель в Метрику.
    // Если onSubmit упадет с ошибкой — цель не отправится (это правильно, форма не отправлена).
    await onSubmit({
      ...form,
      steamProfileUrl, telegramUrl, vkUrl,
      referralType, referrerCallsign,
      referredByUid: referralType === "player" ? form.referredByUid : "",
      howFound: referralType === "text" ? form.howFound : ""
    });

    sendYandexGoal('application_submit_new', {
      gamesCount: form.games.length,
      games: form.games.join(', '),
      timezone: form.timezone,
      referralType: referralType
    });
  }

  return (
    <form className="apply-form" onSubmit={handleSubmit}>

      {showAccountFields && (
        <fieldset className="form-section">
          <legend>Данные для входа</legend>
          <label>Электронная почта</label>
          <input type="email" required value={form.email} onChange={e => updateField("email", e.target.value)} />
          <div className="field-hint">Используется в качестве логина для входа на сайт, а также для связи комбата и его заместителей с вами.</div>

          <label>Пароль</label>
          <input type="password" minLength={6} required value={form.password} onChange={e => updateField("password", e.target.value)} />
          <div className="field-hint">
            Хранится в зашифрованном виде — его никто не увидит.
          </div>
        </fieldset>
      )}

      <fieldset className="form-section">
        <legend>Личные данные</legend>

        <label>Имя и фамилия</label>
        <input type="text" required value={form.fullName} onChange={e => updateField("fullName", e.target.value)} />
        <div className="field-hint">
          Это часть проверки на адекватность — нам лично не нужны ваши личные данные, но нам важно
          понимать, что мы общаемся с настоящим и адекватным человеком.
        </div>

        <label>Возраст</label>
        <input type="number" min={16} max={99} required value={form.age} onChange={e => updateField("age", e.target.value)} />
        <div className="field-hint">В клан принимаются лица от 16 лет.</div>

        <label>Дата рождения <span className="optional-tag">необязательно</span></label>
        <input
          type="text"
          placeholder="ДД.ММ.ГГГГ"
          maxLength={10}
          value={form.birthDate}
          onChange={e => { updateField("birthDate", formatBirthDateInput(e.target.value)); setBirthDateError(""); }}
          onBlur={e => setBirthDateError(validateBirthDate(e.target.value) || "")}
        />
        <div className="field-hint">Нам не нужны ваши личные данные — это только для того, чтобы мы могли вас поздравлять в клане с днём рождения. По желанию, но можно заполнить позже, в любое время.</div>
        {birthDateError && <div className="error">{birthDateError}</div>}
      </fieldset>

      <fieldset className="form-section">
        <legend>Контакты</legend>

        <label>Steam ID
          <ImageHint image="/hints/steam-id.png" alt="Где взять Steam ID" />
        </label>
        <input
          type="text"
          required
          value={form.steamId}
          onChange={e => { updateField("steamId", e.target.value); setSteamIdError(""); }}
          onBlur={e => setSteamIdError(validateSteamId(e.target.value) || "")}
        />
        <div className="field-hint">
          Steam ID — числовой код вашего профиля (не ник и не логин), обязательный контакт для поддержания связи в клане. Он же пригодится вам для регистрации на игровых проектах, на которых мы играем в клане. Он будет отображаться в вашем профиле на сайте, и вы всегда сможете скопировать его оттуда.
        </div>
        {steamIdError && <div className="error">{steamIdError}</div>}
        {steamProfileUrl && !steamIdError && (
          <div className="field-hint">
            Ссылка на ваш профиль: <a href={steamProfileUrl} target="_blank" rel="noreferrer">{steamProfileUrl}</a>
            {" "}— откройте и убедитесь, что это ваш профиль и он публичный.
          </div>
        )}

        <label>Discord ID
          <ImageHint image="/hints/discord-id.png" alt="Где взять Discord ID" />
        </label>
        <input type="text" required value={form.discordId} onChange={e => updateField("discordId", e.target.value)} />
        <div className="field-hint">Discord ID — имя пользователя (не ник), обязательный контакт для поддержания связи в клане. Почти вся коммуникация в клане идёт через Discord.</div>

        <label>Дополнительные контакты <span className="optional-tag">необязательно</span></label>
        <div className="field-hint">
          Нужны, чтобы комбат и его заместители могли связаться с вами, если вы пропадёте со связи.
        </div>
        <div className="extra-contacts-grid">
          <div>
            <input type="text" placeholder="+79991234567" value={form.extraPhone}
              onChange={e => { updateField("extraPhone", e.target.value); setPhoneError(""); }}
              onBlur={e => setPhoneError(validatePhone(e.target.value) || "")} />
            <div className="field-hint">Телефон, в формате с плюсом и кодом страны.</div>
            {phoneError && <div className="error">{phoneError}</div>}
          </div>
          <div>
            <input type="text" placeholder="ivan_ivanov" value={form.extraTelegram}
              onChange={e => { updateField("extraTelegram", e.target.value); setTelegramError(""); }}
              onBlur={e => setTelegramError(validateHandle(e.target.value, "Telegram") || "")} />
            <div className="field-hint">ID аккаунта Telegram, без пробелов и без символа @.</div>
            {telegramUrl && (
              <div className="field-hint">
                Ссылка: <a href={telegramUrl} target="_blank" rel="noreferrer">{telegramUrl}</a> — откройте и убедитесь, что страница открывается.
              </div>
            )}
            {telegramError && <div className="error">{telegramError}</div>}
          </div>
          <div>
            <input type="text" placeholder="ivan_ivanov или id12345678" value={form.extraVk}
              onChange={e => { updateField("extraVk", e.target.value); setVkError(""); }}
              onBlur={e => setVkError(validateHandle(e.target.value, "ВКонтакте") || "")} />
            <div className="field-hint">ID страницы ВКонтакте, без пробелов и без символа @.</div>
            {vkUrl && (
              <div className="field-hint">
                Ссылка: <a href={vkUrl} target="_blank" rel="noreferrer">{vkUrl}</a> — откройте и убедитесь, что страница открывается.
              </div>
            )}
            {vkError && <div className="error">{vkError}</div>}
          </div>
          <div>
            <input type="text" placeholder="Любой другой контакт" value={form.extraOther} onChange={e => updateField("extraOther", e.target.value)} />
            <div className="field-hint">Любой другой удобный способ связи, по желанию.</div>
          </div>
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend>Позывной</legend>
        <label>Укажите ваш позывной</label>
        <input type="text" required value={form.callsign} disabled={isLocked("callsign")}
          onChange={e => updateField("callsign", e.target.value)}
          onBlur={e => setCallsignError(validateCallsign(e.target.value) || "")} />
        {isLocked("callsign") && <div className="field-hint">Смена позывного возможна только через комбата или его заместителя.</div>}

        <div className="callsign-rules">
          <p><b>Обратите внимание: позывной обычно указывается раз и навсегда</b>, его смена
          происходит только при согласовании с комбатом или его заместителем.</p>
          <ul>
            <li>Может состоять из латиницы, цифр и общепринятых символов (-, _, .).</li>
            <li>Должен легко считываться визуально и восприниматься на слух.</li>
            <li>Не должен содержать оскорблений, дискриминации, провокаций или нарушать законодательство России и других государств.</li>
          </ul>
          <p>🚫 <b>Запрещено:</b></p>
          <ul>
            <li>Распространенные имена, фамилии и их производные: <i>Aleks, Sergei, Dimon</i>.</li>
            <li>Кириллица: <i>Киллер200, Немец, Кула40к</i>.</li>
            <li>Дополнительные позывные в скобках, кавычках или через разделители: <i>BURBON (Sergei), Wolf_Ivan</i>.</li>
			<li>Волнообразное чередование регистра: <i>sToRm, AnDrYuHa228</i>.</li>
            <li>Позывные из трёх и более слов (максимум 2 слова).</li>
          </ul>
          <p>📌 <b>Примеры корректных позывных:</b> <i>Storm Breaker, Volchara, Fizik</i>.</p>
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
        <div className="field-hint">
          Обратите внимание: направление Squad пока ещё не запущено, поэтому отметка этого пункта — задел на будущее.
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

        {form.games.includes("Arma Reforger") && (
          <div className="game-detail-block">
            <label>Arma ID
              <ImageHint image="/hints/arma-id.png" alt="Где взять Arma ID" />
            </label>
            <input
              type="text"
              required
              value={form.armaId}
              onChange={e => { updateField("armaId", e.target.value); setArmaIdError(""); }}
              onBlur={e => setArmaIdError(validateArmaId(e.target.value) || "")}
            />
            {armaIdError && <div className="error">{armaIdError}</div>}
            <div className="field-hint">
              Arma ID — код вашей профиля в игре (не ник и не логин). Он же пригодится вам для регистрации на игровых проектах, на которых мы играем в клане. По нему выдаётся доступ по белым спискам на серверы проектов, а также баны в случае нарушений правил. Он будет отображаться в вашем профиле на сайте, и вы всегда сможете скопировать его оттуда.
            </div>
          </div>
        )}
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
        <div className="referral-type-switch">
          <label className="checkbox-label">
            <input type="radio" name="referralType" checked={referralType === "player"}
              onChange={() => { setReferralType("player"); updateField("howFound", ""); }} />
            <span>Меня пригласил боец из клана</span>
          </label>
          <label className="checkbox-label">
            <input type="radio" name="referralType" checked={referralType === "text"}
              onChange={() => { setReferralType("text"); updateField("referredByUid", ""); }} />
            <span>Узнал другим способом</span>
          </label>
        </div>
        {referralType === "player" ? (
          <select value={form.referredByUid} onChange={e => updateField("referredByUid", e.target.value)}>
            <option value="">Выберите бойца...</option>
            {rosterList.map(p => <option key={p.uid} value={p.uid}>{p.callsign}</option>)}
          </select>
        ) : (
          <textarea value={form.howFound} onChange={e => updateField("howFound", e.target.value)}
            placeholder="Расскажите, откуда узнали о клане" />
        )}
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