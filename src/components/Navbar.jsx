import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

export default function Navbar() {
  const { currentUser, profile } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await signOut(auth);
    navigate("/");
  }

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link to="/" className="logo">
          ENEMY <span className="logo-sub">Arma Reforger</span>
        </Link>
        <nav>
          <Link to="/">Главная</Link>
          <Link to="/roster">Состав</Link>
          <Link to="/media">Медиа</Link>
          <Link to="/charter">Устав</Link>
          <Link to="/history">История</Link>
          <Link to="/contact">Контакты</Link>
          <Link to="/queue">Очередь на КО</Link>
          {currentUser ? (
            <>
              <Link to="/profile">{profile?.callsign || "Профиль"}</Link>
              <a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }}>Выйти</a>
            </>
          ) : (
            <>
              <Link to="/login">Войти</Link>
              <Link to="/apply" className="nav-cta">Вступить в клан</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
