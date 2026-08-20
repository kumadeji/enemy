import { useEffect, useState, useRef } from "react";
import { db } from "../firebase";
import { collection, query, where, orderBy, limit, onSnapshot, doc, updateDoc, writeBatch } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";

export default function NotificationBell() {
  const { currentUser } = useAuth();
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!currentUser) return;
    
    const q = query(
      collection(db, "notifications"),
      where("uid", "==", currentUser.uid),
      orderBy("createdAt", "desc"),
      limit(30)
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      },
      (error) => {
        console.error("Ошибка подписки на уведомления:", error);
        if (error.code === "failed-precondition") {
          console.error("⚠️ ТРЕБУЕТСЯ ИНДЕКС! Посмотрите ссылку выше в сообщении ошибки (или в консоли Firebase).");
          alert("Для работы уведомлений нужно создать индекс. См. консоль браузера (F12) для ссылки на создание.");
        }
      }
    );

    return unsubscribe;
  }, [currentUser]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!currentUser) return null;

  const unreadCount = items.filter(i => !i.read).length;

  async function markRead(id) {
    try {
      await updateDoc(doc(db, "notifications", id), { read: true });
    } catch (err) {
      console.error("Не удалось отметить как прочитанное:", err);
    }
  }

  async function markAllRead() {
    try {
      const batch = writeBatch(db);
      items.filter(i => !i.read).forEach(i => batch.update(doc(db, "notifications", i.id), { read: true }));
      await batch.commit();
    } catch (err) {
      console.error("Не удалось отметить все как прочитанные:", err);
    }
  }

  function formatDate(ts) {
    return ts?.seconds ? new Date(ts.seconds * 1000).toLocaleString("ru-RU") : "";
  }

  return (
    <div className="notification-bell-wrapper" ref={wrapperRef}>
      <button type="button" className="notification-bell-btn" onClick={() => setOpen(v => !v)} aria-label="Уведомления">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && <span className="notification-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>}
      </button>

      {open && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <span>Уведомления</span>
            {unreadCount > 0 && <button type="button" className="btn-mini" onClick={markAllRead}>Прочитать все</button>}
          </div>
          <div className="notification-list">
            {items.length === 0 && <p className="hint" style={{ padding: "12px 16px" }}>Уведомлений пока нет.</p>}
            {items.map(item => (
              <div
                key={item.id}
                className={`notification-item ${item.read ? "" : "notification-item-unread"}`}
                onClick={() => !item.read && markRead(item.id)}
              >
                <div className="notification-item-text">{item.message}</div>
                <div className="notification-item-date">{formatDate(item.createdAt)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}