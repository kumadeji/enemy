import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth, db, GOOGLE_SHEETS_URL } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, runTransaction, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import ApplicationForm from "../components/ApplicationForm";

export default function Apply() {
  const { currentUser, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [wasLoggedInOnLoad] = useState(() => !!currentUser);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (wasLoggedInOnLoad) {
    return (
      <main className="container">
        <p className="hint">Вы уже зарегистрированы. <Link to="/profile">Открыть личное дело бойца</Link>.</p>
      </main>
    );
  }

  async function handleSubmit(values) {
    setSubmitting(true);
    setError("");
    try {
      const callsignKey = values.callsign.trim().toLowerCase();
      const callsignRef = doc(db, "callsigns", callsignKey);

      const cred = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const uid = cred.user.uid;

      const hoursByGame = {};
      const experienceByGame = {};
      values.games.forEach(g => {
        hoursByGame[g] = Number(values.gameDetails[g]?.hours || 0);
        experienceByGame[g] = values.gameDetails[g]?.experience || "";
      });

      const extraContacts = {
        phone: values.extraPhone || "",
        telegram: values.extraTelegram || "",
        vk: values.extraVk || "",
        other: values.extraOther || ""
      };

      await runTransaction(db, async (tx) => {
        const existing = await tx.get(callsignRef);
        if (existing.exists()) throw new Error("Этот позывной уже занят, выберите другой.");
        tx.set(callsignRef, { uid });

        tx.set(doc(db, "profiles", uid), {
          callsign: values.callsign.trim(),
          discordId: values.discordId,
          steamId: values.steamId,
          steamProfileUrl: values.steamProfileUrl,
          armaId: values.games.includes("Arma Reforger") ? values.armaId : "",
          extraContacts,
          gamesInterested: values.games,
          status: "Новобранец",
          isSquadLeader: false,
          awards: [],
          koCount: 0,
          ksCount: 0,
          publicNote: "",
          timezone: values.timezone,
          birthDate: values.birthDate || "",
          createdAt: serverTimestamp()
        });

        tx.set(doc(db, "applications", uid), {
          email: values.email, fullName: values.fullName, age: Number(values.age),
          birthDate: values.birthDate || "",
          steamId: values.steamId, steamProfileUrl: values.steamProfileUrl,
          discordId: values.discordId, armaId: values.armaId || "",
          extraContacts,
          hoursByGame, experienceByGame,
          timezone: values.timezone, availability: values.availability,
          whyJoin: values.whyJoin, howFound: values.howFound,
          charterAgreed: values.charterAgreed,
          createdAt: serverTimestamp()
        });
      });

      await refreshProfile();

      if (GOOGLE_SHEETS_URL) {
        fetch(GOOGLE_SHEETS_URL, {
          method: "POST",
          body: JSON.stringify({
            action: "create", uid,
            callsign: values.callsign, email: values.email, fullName: values.fullName, age: values.age,
            steamProfileUrl: values.steamProfileUrl, discordId: values.discordId, armaId: values.armaId,
            extraContacts, gamesInterested: values.games, timezone: values.timezone,
            availability: values.availability, whyJoin: values.whyJoin, howFound: values.howFound,
            charterAgreed: values.charterAgreed
          })
        }).catch(() => {});
      }

      navigate("/my-application");
    } catch (err) {
      setError(err.message || "Ошибка при регистрации.");
      setSubmitting(false);
    }
  }

  return (
    <main className="container">
      <h1>Заявка на вступление</h1>
      <p className="page-lead">
        Мультиигровое сообщество <b>ENEMY</b>. Приём заявок открыт для закрытого направления
        по игре <b>Arma Reforger</b>. После заполнения заявка поступит на рассмотрение комбату и его заместителям.
      </p>
      <ApplicationForm
        onSubmit={handleSubmit}
        submitLabel="Отправить заявку"
        showAccountFields={true}
        submitting={submitting}
        externalError={error}
      />
    </main>
  );
}
