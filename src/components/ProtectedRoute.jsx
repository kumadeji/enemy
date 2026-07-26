import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

export default function ProtectedRoute({ require = "auth", children }) {
  const { currentUser, profile, isAdmin } = useAuth();

  if (!currentUser) {
    return (
      <main className="container">
        <div className="card access-denied">
          <h2>Доступ ограничен</h2>
          <p>Этот раздел доступен только зарегистрированным бойцам клана.</p>
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
          <p>Этот раздел доступен только комбату и его заместителям.</p>
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
              Этот раздел виден бойцам со должностью «Боец запаса» и выше.
              Ваша текущая должность: <b>{status}</b>.
            </p>
            <p>
              Комбат или его заместитель ещё не проверил вашу заявку на вступление — но не переживайте,
              она уже получена и находится на рассмотрении. Как только заявку рассмотрят и примут вас,
              раздел станет доступен автоматически.
            </p>
            <p>
              Вы также можете самостоятельно выйти на связь с комбатом или его заместителями —
              см. раздел «<Link to="/contact">Контакты</Link>».
            </p>
          </div>
        </main>
      );
    }
  }

  return children;
}
