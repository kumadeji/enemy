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
    return <main className="container"><div className="card access-denied"><h2>Доступ запрещён</h2><p>Доступно только комбату и его заместителям.</p></div></main>;
  }

  if (require === "roster") {
    const myRoles = profile?.gameRoles || {};
    const hasAnyAccess = Object.values(myRoles).some(hasRosterAccess);
    if (!isAdmin && !hasAnyAccess) {
      return (
        <main className="container">
          <div className="card access-denied">
            <h2>Доступ ограничен</h2>
            <p>Личные дела других бойцов доступны участникам от состава «Запас» и выше.</p>
            <p>Вы также можете сами выйти на связь с комбатом или его заместителями, подробнее в разделе «<Link to="/contact">Контакты</Link>».</p>
          </div>
        </main>
      );
    }
  }

  if (require === "arma-roster") {
    const gr = profile?.gameRoles?.["Arma Reforger"];
    if (!isAdmin && !hasRosterAccess(gr)) {
      return (
        <main className="container">
          <div className="card access-denied">
            <h2>Доступ ограничен</h2>
            <p>Штаб Arma Reforger доступен участникам направления от состава «Запас» и выше.</p>
          </div>
        </main>
      );
    }
  }

  return children;
}
