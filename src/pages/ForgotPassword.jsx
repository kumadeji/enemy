import { useState } from "react";
import { Link } from "react-router-dom";
import { auth } from "../firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { sendYandexGoal } from "../utils/yandexMetrica";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
      // Отправляем событие запроса на восстановление пароля
      sendYandexGoal('forgot_password_request');
    } catch {
      setError("Не удалось отправить письмо. Проверьте правильность почты.");
    }
  }

  return (
    <main className="container">
      <div className="auth-page">
        <h1>Восстановление пароля</h1>
        {sent ? (
          <div className="card">
            <p>Если такая почта зарегистрирована — на него отправлено письмо со ссылкой для сброса пароля.</p>
            <Link to="/login" className="btn secondary">Вернуться ко входу</Link>
          </div>
        ) : (
          <form className="apply-form" onSubmit={handleSubmit}>
            <fieldset className="form-section">
              <label>Электронная почта</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} />
            </fieldset>
            <button type="submit" className="btn btn-large">Отправить письмо для сброса пароля</button>
            {error && <div className="error">{error}</div>}
          </form>
        )}
      </div>
    </main>
  );
}
