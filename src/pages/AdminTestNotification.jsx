import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { createNotification } from "../utils/notifications";

export default function AdminTestNotification() {
  const { currentUser } = useAuth();
  const [status, setStatus] = useState("");

  async function sendTest() {
    if (!currentUser) return;
    setStatus("Отправляю...");
    try {
      // Отправляем тестовое уведомление САМОМУ СЕБЕ
      await createNotification(
        currentUser.uid,
        "🔔 ТЕСТ: Если вы видите это сообщение в колокольчике — система уведомлений работает исправно!"
      );
      setStatus("✅ Уведомление отправлено! Проверьте колокольчик в шапке сайта.");
    } catch (err) {
      console.error("Ошибка отправки:", err);
      setStatus(`❌ Ошибка: ${err.message}. Проверьте консоль браузера (F12).`);
    }
  }

  return (
    <main className="container">
      <h1>Тест уведомлений</h1>
      <div className="card">
        <p>Нажмите кнопку ниже, чтобы отправить себе тестовое уведомление.</p>
        <p><strong>Важно:</strong> После нажатия откройте выпадающий список уведомлений (колокольчик вверху справа).</p>
        <button className="btn" onClick={sendTest}>Отправить тестовое уведомление</button>
        {status && <p style={{ marginTop: "1rem", fontWeight: "bold" }}>{status}</p>}
        
        <div style={{ marginTop: "2rem", borderTop: "1px solid #eee", paddingTop: "1rem" }}>
          <h3>Как проверить индекс?</h3>
          <ol>
            <li>Откройте консоль браузера (F12).</li>
            <li>Кликните по колокольчику уведомлений в шапке.</li>
            <li>Если в консоли появилась красная ошибка со ссылкой на <code>firebase.google.com</code> — перейдите по ней и создайте индекс.</li>
            <li>Подождите 1-2 минуты создания индекса, затем обновите страницу и попробуйте снова.</li>
          </ol>
        </div>
      </div>
    </main>
  );
}