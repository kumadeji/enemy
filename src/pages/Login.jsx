import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/profile");
    } catch {
      setError("Неверный email или пароль.");
    }
  }

  return (
    <main className="container">
      <h1>Вход в личный кабинет</h1>
      <form className="card" onSubmit={handleSubmit}>
        <label>Email</label>
        <input type="email" required value={email} onChange={e => setEmail(e.target.value)} />
        <label>Пароль</label>
        <input type="password" required value={password} onChange={e => setPassword(e.target.value)} />
        <button type="submit" className="btn">Войти</button>
        {error && <div className="error">{error}</div>}
        <p className="hint">Ещё нет аккаунта? <Link to="/apply">Подать заявку на вступление</Link>.</p>
      </form>
    </main>
  );
}
