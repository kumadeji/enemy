import { useEffect, useState, useRef } from "react";
import { db } from "../firebase";
import { collection, query, where, orderBy, limit, onSnapshot, writeBatch, doc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";

export default function NotificationBell() {
  const { currentUser } = useAuth();
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Подписка на уведомления
  useEffect(() => {
    if (!currentUser) return;
    
    const q = query(
      collection(db, "notifications"),
      where("uid", "==", currentUser.uid),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newItems = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setItems(newItems);
    }, (error) => {
      console.error("Ошибка подписки на уведомления:", error);
    });

    return unsubscribe;
  }, [currentUser]);

  // Закрытие по клику вне области
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

  // Функция удаления всех непрочитанных
  async function clearAllUnread() {
    const unreadItems = items.filter(i => !i.read);
    if (unreadItems.length === 0) return;

    try {
      const batch = writeBatch(db);
      unreadItems.forEach(item => {
        batch.delete(doc(db, "notifications", item.id));
      });
      await batch.commit();
      
      // Мгновенно обновляем локальный стейт, оставляя только прочитанные
      setItems(prev => prev.filter(i => i.read));
      // Окно НЕ закрываем, пользователь увидит пустой список или старые прочитанные
    } catch (error) {
      console.error("Ошибка при удалении уведомлений:", error);
      alert("Не удалось удалить уведомления. Проверьте консоль.");
    }
  }

  // Форматирование даты
  function formatDate(ts) {
    if (!ts?.seconds) return "";
    const date = new Date(ts.seconds * 1000);
    return date.toLocaleString("ru-RU", { 
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
    });
  }

  return (
    <div className="notification-bell-wrapper" ref={wrapperRef} style={{ position: 'relative' }}>
      {/* Кнопка-колокольчик */}
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

      {/* Выпадающее окно */}
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
                onClick={clearAllUnread}
                title="Удалить все непрочитанные"
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