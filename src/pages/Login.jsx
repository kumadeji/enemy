import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { sendYandexGoal } from "../utils/yandexMetrica";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Отправляем событие успешного входа в Яндекс Метрику
      sendYandexGoal('login_success');
      navigate("/profile");
    } catch {
      setError("Неверная электронная почта или пароль.");
      setSubmitting(false);
    }
  }

  return (
    <main className="container">
      <div className="auth-page">
        <h1>Вход в личный кабинет бойца</h1>
        <p className="page-lead">Мультиигровое сообщество <b>ENEMY</b></p>

        <form className="apply-form" onSubmit={handleSubmit}>
          <fieldset className="form-section">
            <label>Электронная почта</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} />

            <label>Пароль</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} />
          </fieldset>

          <button type="submit" className="btn btn-large" disabled={submitting}>
            {submitting ? "Вход..." : "Войти"}
          </button>
          {error && <div className="error">{error}</div>}
        </form>

        <p className="auth-alt-action">
          Ещё не вступили? <Link to="/apply">Подать заявку на вступление</Link>.
        </p>
		<p className="auth-alt-action"><Link to="/forgot-password">Забыли пароль?</Link></p>
      </div>
    </main>
  );
}
