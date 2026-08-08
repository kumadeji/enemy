import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { hasRosterAccess } from "../data/gameRoles";

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
            <Link to="/login" className="btn secondary">Я уже принят в клан — войти</Link>
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
    // Проверяем, есть ли у пользователя допуск (состав "Запас" или "Личный
    // состав") хотя бы в ОДНОЙ из игр. Это клиентская UX-проверка — точное
    // разграничение "по нужной именно игре" в любом случае обеспечивают
    // правила Firestore при попытке прочитать конкретный профиль.
    const myRoles = profile?.gameRoles || {};
    const hasAnyAccess = Object.values(myRoles).some(hasRosterAccess);

    if (!isAdmin && !hasAnyAccess) {
      return (
        <main className="container">
          <div className="card access-denied">
            <h2>Доступ ограничен</h2>
            <p>
              Личные дела других бойцов доступны от состава «Запас» и выше.
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
