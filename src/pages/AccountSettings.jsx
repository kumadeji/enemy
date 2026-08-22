import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  reauthenticateWithCredential, EmailAuthProvider,
  verifyBeforeUpdateEmail, updatePassword
} from "firebase/auth";
import { sendYandexGoal } from "../utils/yandexMetrica";

function translateAuthError(err) {
  switch (err.code) {
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Неверный текущий пароль.";
    case "auth/too-many-requests":
      return "Слишком много попыток. Попробуйте позже.";
    case "auth/email-already-in-use":
      return "Эта почта уже используется другим бойцом.";
    case "auth/invalid-email":
      return "Некорректный формат почты.";
    case "auth/weak-password":
      return "Новый пароль слишком простой — минимум 6 символов.";
    case "auth/requires-recent-login":
      return "Сессия устарела — выйдите и войдите заново, затем повторите попытку.";
    default:
      return "Произошла ошибка: " + err.message;
  }
}

export default function AccountSettings() {
  const { currentUser } = useAuth();

  // ---- Смена email ----
  const [emailPassword, setEmailPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [emailSubmitting, setEmailSubmitting] = useState(false);
  const [emailMessage, setEmailMessage] = useState("");
  const [emailError, setEmailError] = useState("");

  // ---- Смена пароля ----
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordRepeat, setNewPasswordRepeat] = useState("");
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  async function handleChangeEmail(e) {
    e.preventDefault();
    setEmailError("");
    setEmailMessage("");

    if (!newEmail.trim() || !emailPassword) {
      setEmailError("Заполните оба поля.");
      return;
    }
    if (newEmail.trim().toLowerCase() === currentUser.email.toLowerCase()) {
      setEmailError("Это и есть ваша текущая почта.");
      return;
    }

    setEmailSubmitting(true);
    try {
      const credential = EmailAuthProvider.credential(currentUser.email, emailPassword);
      await reauthenticateWithCredential(currentUser, credential);
      await verifyBeforeUpdateEmail(currentUser, newEmail.trim());
      setEmailMessage(
        `Письмо с подтверждением отправлено на ${newEmail.trim()}. Перейдите по ссылке в письме — после этого почта на сайте обновится автоматически.`
      );
      setEmailPassword("");
      setNewEmail("");
    } catch (err) {
      setEmailError(translateAuthError(err));
    } finally {
      setEmailSubmitting(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setPasswordError("");
    setPasswordMessage("");

    if (!currentPassword || !newPassword) {
      setPasswordError("Заполните все поля.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("Новый пароль должен быть не короче 6 символов.");
      return;
    }
    if (newPassword !== newPasswordRepeat) {
      setPasswordError("Пароли не совпадают.");
      return;
    }

    setPasswordSubmitting(true);
    try {
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, newPassword);
      setPasswordMessage("Пароль успешно изменён.");
      setCurrentPassword("");
      setNewPassword("");
      setNewPasswordRepeat("");
      // Отправляем событие успешной смены пароля
      sendYandexGoal("change_password_success");
    } catch (err) {
      setPasswordError(translateAuthError(err));
    } finally {
      setPasswordSubmitting(false);
    }
  }

  return (
    <main className="container">
      <h1>Изменение данных для авторизации</h1>

      <div className="card">
        <h2>Электронная почта</h2>
        <p className="field-hint">Текущая почта: <b>{currentUser.email}</b></p>
        <form onSubmit={handleChangeEmail}>
          <label>Новая почта</label>
          <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} />

          <label>Текущий пароль (для подтверждения)</label>
          <input type="password" value={emailPassword} onChange={e => setEmailPassword(e.target.value)} />

          <button type="submit" className="btn secondary" disabled={emailSubmitting}>
            {emailSubmitting ? "Отправка..." : "Сменить почту"}
          </button>
          {emailMessage && <p className="hint">{emailMessage}</p>}
          {emailError && <div className="error">{emailError}</div>}
        </form>
      </div>

      <div className="card">
        <h2>Пароль</h2>
        <form onSubmit={handleChangePassword}>
          <label>Текущий пароль</label>
          <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />

          <label>Новый пароль</label>
          <input type="password" minLength={6} value={newPassword} onChange={e => setNewPassword(e.target.value)} />

          <label>Повторите новый пароль</label>
          <input type="password" minLength={6} value={newPasswordRepeat} onChange={e => setNewPasswordRepeat(e.target.value)} />

          <button type="submit" className="btn secondary" disabled={passwordSubmitting}>
            {passwordSubmitting ? "Сохранение..." : "Сменить пароль"}
          </button>
          {passwordMessage && <p className="hint">{passwordMessage}</p>}
          {passwordError && <div className="error">{passwordError}</div>}
        </form>
      </div>
    </main>
  );
}
