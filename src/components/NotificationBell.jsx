import { useEffect, useState, useRef } from "react";
import { db } from "../firebase";
import { collection, query, where, orderBy, limit, onSnapshot, doc, updateDoc, writeBatch } from "firebase/firestore";
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
      limit(50) // Берем чуть больше для истории
    );
    
    const unsubscribe = onSnapshot(q, 
      (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setItems(data);
      },
      (error) => {
        console.error("Ошибка подписки на уведомления:", error);
        // Если ошибка связана с индексом, она будет видна в консоли
      }
    );
    return unsubscribe;
  }, [currentUser]);

  // Закрытие при клике вне области
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

  async function markRead(id) {
    try {
      await updateDoc(doc(db, "notifications", id), { read: true });
    } catch (e) {
      console.error("Не удалось отметить как прочитанное", e);
    }
  }

  async function markAllRead() {
    try {
      const batch = writeBatch(db);
      items.filter(i => !i.read).forEach(i => {
        batch.update(doc(db, "notifications", i.id), { read: true });
      });
      await batch.commit();
    } catch (e) {
      console.error("Ошибка при чтении всех уведомлений", e);
    }
  }

  function formatDate(ts) {
    if (!ts?.seconds) return "";
    const date = new Date(ts.seconds * 1000);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Только что";
    if (diffMins < 60) return `${diffMins} мин. назад`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} ч. назад`;
    return date.toLocaleDateString("ru-RU", { day: 'numeric', month: 'long' });
  }

  return (
    <div className="notification-bell-wrapper" ref={wrapperRef} style={{ position: "relative", display: "inline-block" }}>
      {/* Кнопка-колокольчик */}
      <button 
        type="button" 
        className="nav-link notification-btn" 
        onClick={() => setOpen(v => !v)} 
        aria-label="Уведомления"
        style={{ 
          position: "relative", 
          background: "transparent", 
          border: "none", 
          cursor: "pointer", 
          padding: "8px", 
          borderRadius: "6px",
          color: "inherit",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "background 0.2s"
        }}
        onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
        onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        
        {/* Бейдж со счетчиком */}
        {unreadCount > 0 && (
          <span style={{
            position: "absolute",
            top: "4px",
            right: "4px",
            background: "#ef4444",
            color: "white",
            fontSize: "10px",
            fontWeight: "bold",
            minWidth: "16px",
            height: "16px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "2px solid #1a1a1a", // Цвет фона шапки для обводки
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
          }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Выпадающее окно */}
      {open && (
        <div style={{
          position: "absolute",
          top: "100%",
          right: "0",
          marginTop: "8px",
          width: "320px",
          maxHeight: "400px",
          background: "#252525", // Темный фон под стиль сайта
          borderRadius: "12px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
          border: "1px solid #333",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          animation: "slideDown 0.2s ease-out"
        }}>
          {/* Шапка dropdown */}
          <div style={{
            padding: "12px 16px",
            borderBottom: "1px solid #333",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#2a2a2a"
          }}>
            <span style={{ fontWeight: "600", fontSize: "14px", color: "#fff" }}>Уведомления</span>
            {unreadCount > 0 && (
              <button 
                type="button" 
                onClick={markAllRead}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#4ade80",
                  fontSize: "12px",
                  cursor: "pointer",
                  fontWeight: "500"
                }}
              >
                Прочитать все
              </button>
            )}
          </div>

          {/* Список */}
          <div style={{
            overflowY: "auto",
            flex: 1
          }}>
            {items.length === 0 ? (
              <div style={{ padding: "20px", textAlign: "center", color: "#888", fontSize: "13px" }}>
                Уведомлений пока нет
              </div>
            ) : (
              items.map(item => (
                <div
                  key={item.id}
                  onClick={() => !item.read && markRead(item.id)}
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid #333",
                    background: item.read ? "transparent" : "rgba(74, 222, 128, 0.05)", // Легкий зеленый фон для непрочитанных
                    cursor: item.read ? "default" : "pointer",
                    transition: "background 0.2s",
                    position: "relative"
                  }}
                  onMouseOver={(e) => { if(!item.read) e.currentTarget.style.background = "rgba(74, 222, 128, 0.1)"; }}
                  onMouseOut={(e) => { if(!item.read) e.currentTarget.style.background = "rgba(74, 222, 128, 0.05)"; }}
                >
                  {/* Индикатор непрочитанного */}
                  {!item.read && (
                    <span style={{
                      position: "absolute",
                      top: "14px",
                      left: "6px",
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: "#4ade80"
                    }} />
                  )}
                  
                  <div style={{ 
                    fontSize: "13px", 
                    lineHeight: "1.4", 
                    color: item.read ? "#ccc" : "#fff",
                    marginLeft: !item.read ? "10px" : "0",
                    paddingRight: "8px"
                  }}>
                    {item.message}
                  </div>
                  <div style={{ 
                    fontSize: "11px", 
                    color: "#666", 
                    marginTop: "6px",
                    marginLeft: !item.read ? "10px" : "0"
                  }}>
                    {formatDate(item.createdAt)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        /* Скроллбар для списка */
        .notification-bell-wrapper div[style*="overflow-y"]::-webkit-scrollbar {
          width: 6px;
        }
        .notification-bell-wrapper div[style*="overflow-y"]::-webkit-scrollbar-track {
          background: #252525;
        }
        .notification-bell-wrapper div[style*="overflow-y"]::-webkit-scrollbar-thumb {
          background: #444;
          border-radius: 3px;
        }
        .notification-bell-wrapper div[style*="overflow-y"]::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </div>
  );
}