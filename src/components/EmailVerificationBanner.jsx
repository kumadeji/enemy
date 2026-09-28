import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { sendEmailVerification } from "firebase/auth";
import { sendYandexGoal } from "../utils/yandexMetrica";

const COOLDOWN_SECONDS = 60;

export default function EmailVerificationBanner() {
  const { currentUser } = useAuth();
  const [sending, setSending] = useState(false);
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const [error, setError] = useState("");
  const timerRef = useRef(null);
  const storageKey = currentUser ? `enemy_email_verify_last_sent_${currentUser.uid}` : null;

  useEffect(() => {
    if (!storageKey) return;
    const last = Number(localStorage.getItem(storageKey) || 0);
    const remaining = COOLDOWN_SECONDS - Math.floor((Date.now() - last) / 1000);
    if (remaining > 0) setCooldownLeft(remaining);
  }, [storageKey]);

  useEffect(() => {
    if (cooldownLeft <= 0) return;
    timerRef.current = setTimeout(() => setCooldownLeft(c => c - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [cooldownLeft]);

  if (!currentUser || currentUser.emailVerified) return null;

  async function handleResend() {
    if (sending || cooldownLeft > 0) return;
    setSending(true);
    setError("");
    try {
      await sendEmailVerification(currentUser);
      localStorage.setItem(storageKey, String(Date.now()));
      setCooldownLeft(COOLDOWN_SECONDS);
      sendYandexGoal("send_verification_email");
    } catch (err) {
      setError(
        err.code === "auth/too-many-requests"
          ? "Слишком много попыток — попробуйте позже."
          : "Не удалось отправить письмо. Попробуйте ещё раз позже."
      );
    } finally {
      setSending(false);
    }
  }

  const isDisabled = sending || cooldownLeft > 0;
  let label = "Отправить письмо";
  if (sending) label = "Отправка...";
  else if (cooldownLeft > 0) label = `Повторно через ${cooldownLeft} с.`;

  return (
    <div className="email-verify-banner">
      <span>
        Подтвердите вашу электронную почту — нажмите кнопку, чтобы получить письмо.
        {error && <> — {error}</>}
      </span>
      <button type="button" className="btn-mini" onClick={handleResend} disabled={isDisabled}>
        {label}
      </button>
    </div>
  );
}
