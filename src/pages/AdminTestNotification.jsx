import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function AdminTestNotification() {
  const { currentUser } = useAuth();
  const [status, setStatus] = useState("");

  async function sendTest() {
    if (!currentUser) return;
    setStatus("Отправка...");
    try {
      await addDoc(collection(db, "notifications"), {
        uid: currentUser.uid,
        message: `🔔 Тестовое уведомление ${new Date().toLocaleTimeString()}. Проверь дизайн!`,
        read: false,
        createdAt: serverTimestamp()
      });
      setStatus("✅ Уведомление отправлено!");
      setTimeout(() => setStatus(""), 3000);
    } catch (e) {
      setStatus("❌ Ошибка: " + e.message);
    }
  }

  return (
    <main className="container" style={{ maxWidth: "600px", marginTop: "40px" }}>
      <div className="card">
        <h2>🔔 Тест уведомлений</h2>
        <p>Нажми кнопку ниже, чтобы отправить себе тестовое сообщение.</p>
        <p style={{ fontSize: "13px", color: "#888" }}>
          Текущий пользователь: <strong>{currentUser?.email}</strong>
        </p>
        
        <button className="btn" onClick={sendTest} style={{ marginTop: "10px" }}>
          Отправить тестовое уведомление
        </button>

        {status && (
          <p style={{ marginTop: "15px", fontWeight: "bold", color: status.includes("✅") ? "#4ade80" : "#ef4444" }}>
            {status}
          </p>
        )}

        <div style={{ marginTop: "30px", padding: "15px", background: "#222", borderRadius: "8px", fontSize: "13px" }}>
          <strong>Инструкция:</strong>
          <ol style={{ paddingLeft: "20px", marginTop: "10px", lineHeight: "1.6" }}>
            <li>Нажми кнопку отправки.</li>
            <li>Кликни по колокольчику в шапке сайта (справа).</li>
            <li>Проверь, появилось ли сообщение с зеленой точкой.</li>
            <li>Нажми на само сообщение — точка должна исчезнуть.</li>
            <li>Нажми "Прочитать все" — все точки должны пропасть.</li>
          </ol>
        </div>
      </div>
    </main>
  );
}