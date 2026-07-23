import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

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
      navigate("/profile");
    } catch {
      setError("Неверный email или пароль.");
      setSubmitting(false);
    }
  }

  return (
    <main className="container">
      <div className="auth-page">
        <h1>Вход в личный кабинет</h1>
        <p className="page-lead">Игровое сообщество <b>ENEMY</b>, направление Arma Reforger.</p>

        <form className="apply-form" onSubmit={handleSubmit}>
          <fieldset className="form-section">
            <label>Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} />

            <label>Пароль</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} />
            <div className="field-hint">
              Восстановление пароля на сайте не предусмотрено. Если вы забыли пароль —
              обратитесь к администрации сообщества для сброса аккаунта.
            </div>
          </fieldset>

          <button type="submit" className="btn btn-large" disabled={submitting}>
            {submitting ? "Вход..." : "Войти"}
          </button>
          {error && <div className="error">{error}</div>}
        </form>

        <p className="auth-alt-action">
          Ещё нет аккаунта? <Link to="/apply">Подать заявку на вступление</Link>.
        </p>
      </div>
    </main>
  );
}
