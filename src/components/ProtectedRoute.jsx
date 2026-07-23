import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

export default function ProtectedRoute({ require = "auth", children }) {
  const { currentUser, profile, isAdmin } = useAuth();

  if (!currentUser) {
    return (
      <main className="container">
        <div className="card access-denied">
          <h2>Доступ ограничен</h2>
          <p>Этот раздел доступен только зарегистрированным участникам клана.</p>
          <div className="access-actions">
            <Link to="/apply" className="btn">Подать заявку на вступление</Link>
            <Link to="/login" className="btn secondary">У меня уже есть аккаунт — войти</Link>
          </div>
        </div>
      </main>
    );
  }

  if (require === "admin" && !isAdmin) {
    return (
      <main className="container">
        <div className="card access-denied">
          <h2>Доступ запрещён</h2>
          <p>Этот раздел доступен только администраторам клана.</p>
        </div>
      </main>
    );
  }

  if (require === "roster") {
    const allowed = ["Боец запаса", "Боец личного состава", "Командир"];
    if (!isAdmin && (!profile || !allowed.includes(profile.status))) {
      return (
        <main className="container">
          <div className="card access-denied">
            <h2>Доступ ограничен</h2>
            <p>
              Этот раздел виден участникам со статусом «Боец запаса» и выше.
              Ваш текущий статус: <b>{profile ? profile.status : "неизвестен"}</b>.
            </p>
            <p>Как только администрация повысит ваш статус, раздел станет доступен.</p>
          </div>
        </main>
      );
    }
  }

  return children;
}
