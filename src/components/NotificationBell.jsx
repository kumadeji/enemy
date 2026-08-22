import { useEffect, useState, useRef } from "react";
import { db } from "../firebase";
import { collection, query, where, orderBy, limit, onSnapshot, writeBatch, doc, updateDoc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { sendYandexGoal } from "../utils/yandexMetrica";

export default function NotificationBell() {
  const { currentUser } = useAuth();
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  // ✅ Добавляем ref, чтобы не отправлять цель открытия повторно,
  // пока колокольчик открыт (например, когда приходят новые уведомления).
  const hasSentOpenRef = useRef(false);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "notifications"),
      where("uid", "==", currentUser.uid),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => {
      console.error("Ошибка подписки на уведомления:", error);
    });

    return unsubscribe;
  }, [currentUser]);

  // ✅ ИСПРАВЛЕНО: отправляем цель при открытии колокольчика ровно один раз,
  // пока он не будет закрыт. Не зависит от загрузки items.
  useEffect(() => {
    if (open && !hasSentOpenRef.current) {
      const unreadCount = items.filter(i => !i.read).length;
      sendYandexGoal('open_notifications', { totalNotifications: items.length, unreadCount });
      hasSentOpenRef.current = true;
    }
    if (!open) {
      // Сбрасываем флаг при закрытии, чтобы при следующем открытии цель снова отправилась.
      hasSentOpenRef.current = false;
    }
  }, [open, items]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!currentUser) return null;

  const unreadCount = items.filter(i => !i.read).length;

  // Помечает ОДНО уведомление прочитанным — разрешено правилами всем бойцам
  // (update, затрагивающий только поле read у своего же документа)
  async function markRead(id) {
    try {
      await updateDoc(doc(db, "notifications", id), { read: true });
    } catch (err) {
      console.error("Ошибка при пометке уведомления прочитанным:", err);
    }
  }

  // Массовая пометка прочитанными — тоже через update, а не delete,
  // иначе обычные бойцы получат "Missing or insufficient permissions"
  // (правила разрешают им удалять чужие... то есть свои документы
  // только админам, а не самому владельцу)
  async function markAllRead() {
    const unreadItems = items.filter(i => !i.read);
    if (unreadItems.length === 0) return;

    try {
      const batch = writeBatch(db);
      unreadItems.forEach(item => {
        batch.update(doc(db, "notifications", item.id), { read: true });
      });
      await batch.commit();
    } catch (error) {
      console.error("Ошибка при пометке уведомлений прочитанными:", error);
      alert("Не удалось пометить уведомления прочитанными. Проверьте консоль.");
    }
  }

  function formatDate(ts) {
    if (!ts?.seconds) return "";
    const date = new Date(ts.seconds * 1000);
    return date.toLocaleString("ru-RU", {
      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
    });
  }

  return (
    <div className="notification-bell-wrapper" ref={wrapperRef} style={{ position: "relative" }}>
      <button
        type="button"
        className="nav-notification-btn"
        onClick={() => setOpen(v => !v)}
        aria-label="Уведомления"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="nav-notification-badge">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="notification-dropdown-card">
          <div className="notification-dropdown-header">
            <span className="dropdown-title">
              Уведомления {unreadCount > 0 && <span className="unread-indicator">({unreadCount})</span>}
            </span>
            {unreadCount > 0 && (
              <button
                type="button"
                className="btn-mark-read"
                onClick={markAllRead}
                title="Пометить все прочитанными"
              >
                Прочитать все
              </button>
            )}
          </div>

          <div className="notification-list-container">
            {items.length === 0 ? (
              <div className="empty-state">
                <p>Нет уведомлений</p>
              </div>
            ) : (
              items.map(item => (
                <div
                  key={item.id}
                  className={`notification-item ${item.read ? "" : "notification-item-unread"}`}
                  onClick={() => !item.read && markRead(item.id)}
                  style={{ cursor: item.read ? "default" : "pointer" }}
                >
                  <div className="notification-content">
                    <div className="notification-message">{item.message}</div>
                    <div className="notification-date">{formatDate(item.createdAt)}</div>
                  </div>
                  {!item.read && <div className="unread-dot"></div>}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}