import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const TITLE_MAP = [
  { test: p => p === "/", title: "Главная" },
  { test: p => p.startsWith("/apply"), title: "Заявка на вступление" },
  { test: p => p.startsWith("/login"), title: "Вход" },
  { test: p => p.startsWith("/forgot-password"), title: "Восстановление пароля" },
  { test: p => p.startsWith("/my-application"), title: "Редактирование анкеты" },
  { test: p => p.startsWith("/profile"), title: "Личное дело" },
  { test: p => p.startsWith("/roster"), title: "Состав" },
  { test: p => p.startsWith("/media"), title: "Видео" },
  { test: p => p.startsWith("/charter"), title: "Устав и манифест" },
  { test: p => p.startsWith("/history"), title: "История" },
  { test: p => p.startsWith("/contact"), title: "Контакты" },
  { test: p => p.startsWith("/hq/arma/stats"), title: "Клановая статистика - Arma Reforger" },
  { test: p => p.startsWith("/hq/arma"), title: "Штаб - Arma Reforger" },
  { test: p => p.startsWith("/queue"), title: "Очередь на КО - Arma Reforger" },
  { test: p => p.startsWith("/admin/changelog"), title: "Журнал изменений" },
  { test: p => p.startsWith("/admin/migrate"), title: "Миграция данных" },
  { test: p => p.startsWith("/admin/player"), title: "Личное дело — Панель комбата" },
  { test: p => p.startsWith("/admin"), title: "Панель комбата" },
];

export default function PageTitle() {
  const location = useLocation();
  useEffect(() => {
    const match = TITLE_MAP.find(m => m.test(location.pathname));
    document.title = match ? `${match.title} — ENEMY` : "ENEMY — Мультиигровое сообщество";
  }, [location]);
  return null;
}
