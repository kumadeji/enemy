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
    // Если статус ещё не подгрузился по какой-то причине — считаем "Новобранец" по умолчанию,
    // а не показываем "неизвестен": это соответствует статусу, который присваивается при регистрации.
    const status = profile?.status || "Новобранец";

    if (!isAdmin && !allowed.includes(status)) {
      return (
        <main className="container">
          <div className="card access-denied">
            <h2>Доступ ограничен</h2>
            <p>
              Этот раздел виден участникам со статусом «Боец запаса» и выше.
              Ваш текущий статус: <b>{status}</b>.
            </p>
            <p>
              Администрация ещё не проверила вашу заявку на вступление в клан — но не переживайте,
              она уже получена и находится на рассмотрении. Как только статус будет повышен,
              раздел станет доступен автоматически.
            </p>
            <p>
              Вы также можете самостоятельно выйти на связь с администрацией —
              см. раздел «<Link to="/contact">Связаться с кланом</Link>».
            </p>
          </div>
        </main>
      );
    }
  }

  return children;
}
