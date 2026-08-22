import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { hasRosterAccess } from "../data/gameRoles";
import logo from "./Logo.jpg";
import NotificationBell from "./NotificationBell";
import { sendYandexGoal } from "../utils/yandexMetrica";

export default function Navbar() {
  const { currentUser, profile, isAdmin } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await signOut(auth);
    navigate("/");
  }

  const linkClass = ({ isActive }) => "nav-link" + (isActive ? " active" : "");
  const canSeeArmaHQ = isAdmin || hasRosterAccess(profile?.gameRoles?.["Arma Reforger"]);

  return (
    <header className="site-header">
      <div className="container-header header-inner">
        <NavLink to="/" className="logo">
          <img src={logo} alt="ENEMY" className="logo-img" />
        </NavLink>
        <nav>
          <NavLink to="/" end className={linkClass}>Главная</NavLink>
          <NavLink to="/roster" className={linkClass}>Состав</NavLink>
		  
		  {/* Закомментированные кнопки */}
          {/* 
		  <NavLink to="/media" className={linkClass}>Видео</NavLink>
          <NavLink to="/charter" className={linkClass}>Устав и манифест</NavLink>
          <NavLink to="/history" className={linkClass}>История</NavLink>
          <NavLink to="/contact" className={linkClass}>Контакты</NavLink>
		  */}

          {canSeeArmaHQ && (
            <>
              <span className="nav-divider" />
              <NavLink to="/hq/arma" className="nav-link nav-hq-btn">Штаб Arma Reforger</NavLink>
            </>
          )}

          <span className="nav-divider" />
          {isAdmin && <NavLink to="/admin" className={linkClass}>Панель комбата</NavLink>}
          {currentUser ? (
            <>
              <NavLink to="/profile" className={linkClass}>{profile?.callsign || "Личное дело"}</NavLink>
			  <NotificationBell /> 
              <a href="#" className="nav-link" onClick={e => { e.preventDefault(); handleLogout(); }}>Выйти</a>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClass}>Войти</NavLink>
              <NavLink 
                to="/apply" 
                className="nav-link nav-cta"
                onClick={() => sendYandexGoal('click_apply_button')}
              >
                Подать заявку
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
