import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import logo from "./Logo.jpg";

export default function Navbar() {
  const { currentUser, profile } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await signOut(auth);
    navigate("/");
  }

  const linkClass = ({ isActive }) => "nav-link" + (isActive ? " active" : "");

  return (
    <header className="site-header">
      <div className="container-header header-inner">
        <NavLink to="/" className="logo">
          <img src={logo} alt="ENEMY" className="logo-img" />
        </NavLink>
        <nav>
          <NavLink to="/" end className={linkClass}>Главная</NavLink>
          <NavLink to="/roster" className={linkClass}>Состав</NavLink>
          <NavLink to="/media" className={linkClass}>Медиаресурсы</NavLink>
          <NavLink to="/charter" className={linkClass}>Устав и манифест</NavLink>
          <NavLink to="/history" className={linkClass}>История</NavLink>
          <NavLink to="/contact" className={linkClass}>Контакты</NavLink>
          <NavLink to="/queue" className={linkClass}>Очередь на КО</NavLink>
          {currentUser ? (
            <>
              <NavLink to="/profile" className={linkClass}>{profile?.callsign || "Профиль"}</NavLink>
              <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); handleLogout(); }}>Выйти</a>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClass}>Войти</NavLink>
              <NavLink to="/apply" className="nav-link nav-cta">Вступить в клан</NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}