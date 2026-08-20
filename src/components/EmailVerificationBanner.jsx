import { useAuth } from "../context/AuthContext";
import { sendEmailVerification } from "firebase/auth";
import { useState } from "react";

export default function EmailVerificationBanner() {
  const { currentUser, profile } = useAuth();
  const [sent, setSent] = useState(false);

  if (!currentUser || currentUser.emailVerified) return null;

  // Определяем, недавно ли зарегистрировался пользователь (менее 5 минут назад)
  const createdAt = profile?.createdAt;
  const now = Date.now();
  const fiveMinutesMs = 5 * 60 * 1000;
  const isRecentRegistration = createdAt && (now - createdAt.toDate().getTime()) < fiveMinutesMs;

  async function handleResend() {
    await sendEmailVerification(currentUser);
    setSent(true);
  }

  return (
    <div className="email-verify-banner">
      <span>
        {isRecentRegistration
          ? "Подтвердите вашу электронную почту — мы отправили письмо со ссылкой при регистрации."
          : "Подтвердите вашу электронную почту — нажмите кнопку, чтобы получить письмо."}
      </span>
      <button type="button" className="btn-mini" onClick={handleResend} disabled={sent}>
        {sent ? "Письмо отправлено" : (isRecentRegistration ? "Отправить письмо ещё раз" : "Отправить письмо")}
      </button>
    </div>
  );
}
