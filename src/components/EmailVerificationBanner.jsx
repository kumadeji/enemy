import { useAuth } from "../context/AuthContext";
import { sendEmailVerification } from "firebase/auth";
import { useState } from "react";

export default function EmailVerificationBanner() {
  const { currentUser } = useAuth();
  const [sent, setSent] = useState(false);

  if (!currentUser || currentUser.emailVerified) return null;

  async function handleResend() {
    await sendEmailVerification(currentUser);
    setSent(true);
  }

  return (
    <div className="email-verify-banner">
      <span>Подтвердите вашу электронную почту — мы отправили письмо со ссылкой при регистрации.</span>
      <button type="button" className="btn-mini" onClick={handleResend} disabled={sent}>
        {sent ? "Письмо отправлено" : "Отправить письмо ещё раз"}
      </button>
    </div>
  );
}
