import { Link, useLocation } from "react-router-dom";

// Страницы, где текст подвала центрируется по экрану
const CENTERED_PATHS = ["/login", "/forgot-password"];

export default function SiteFooter() {
  const { pathname } = useLocation();
  const centered = CENTERED_PATHS.some(p => pathname.startsWith(p));

  return (
    <footer className={"site-footer" + (centered ? " footer-centered" : "")}>
      <div className="container">
        <div className="footer-main">
          <b>Мультиигровое сообщество ENEMY</b>. Разработка: [En-Y]Boba, aka kumadeji
        </div>
        <div className="footer-small">
          По вопросам клана: serega_burbon (Discord, ВКонтакте, Telegram). По техническим вопросам: kumadeji (Discord, Telegram)
        </div>
        <div className="footer-small">
          <Link to="/terms">Пользовательское соглашение и Политика обработки персональных данных</Link>
          {" · "}
          <Link to="/consent">Согласие на обработку персональных данных</Link>
        </div>
      </div>
    </footer>
  );
}
