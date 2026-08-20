import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, runTransaction, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import ApplicationForm from "../components/ApplicationForm";
import { defaultGameRole } from "../data/gameRoles";
import { buildTelegramUrl, buildVkUrl } from "../utils/socialLinks";
import { buildRosterPublicPayload } from "../utils/rosterPublic";
import { sendEmailVerification } from "firebase/auth";

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
	  await sendEmailVerification(cred.user).catch(() => {});

      const hoursByGame = {};
      const experienceByGame = {};
      values.games.forEach(g => {
        hoursByGame[g] = Number(values.gameDetails[g]?.hours || 0);
        experienceByGame[g] = values.gameDetails[g]?.experience || "";
      });

      const extraContacts = {
        phone: values.extraPhone || "", telegram: values.extraTelegram || "",
        vk: values.extraVk || "", other: values.extraOther || ""
      };

      const gameRoles = Object.fromEntries(values.games.map(g => [g, defaultGameRole()]));
      const gameStats = Object.fromEntries(values.games.map(g => [g, { playedAsSoldierCount: 0, koCount: 0, ksCount: 0 }]));
      const gameNotes = Object.fromEntries(values.games.map(g => [g, ""]));
      const gameAwards = Object.fromEntries(values.games.map(g => [g, []]));
      const gameDisciplinaryActions = Object.fromEntries(values.games.map(g => [g, []]));

      const profileData = {
        // Анкетные данные (раньше жили в отдельной коллекции applications)
        email: values.email,
        fullName: values.fullName,
        age: Number(values.age),
        availability: values.availability,
        whyJoin: values.whyJoin,
        howFound: values.referralType === "text" ? values.howFound : "",
        referrerCallsign: values.referrerCallsign || "",
        hoursByGame, experienceByGame,
        charterAgreed: values.charterAgreed,

        // Личные данные и контакты
        callsign: values.callsign.trim(),
        discordId: values.discordId,
        steamId: values.steamId,
        steamProfileUrl: values.steamProfileUrl,
        armaId: values.games.includes("Arma Reforger") ? values.armaId : "",
        extraContacts,
        telegramUrl: buildTelegramUrl(values.extraTelegram),
        vkUrl: buildVkUrl(values.extraVk),
        birthDatePublic: true,
        contactsPublic: { phone: true, telegram: true, vk: true, other: true },
        timezone: values.timezone,
        birthDate: values.birthDate || "",

        // Игровая часть
        gamesInterested: values.games,
        gameRoles, gameStats, gameNotes, gameAwards, gameDisciplinaryActions,
        globalAwards: [],
        globalDisciplinaryActions: [],

        // Реферальная система
        referredByUid: values.referralType === "player" ? values.referredByUid : "",
        referredByText: values.referralType === "text" ? values.howFound : "",

        // Внутренняя заметка администрации (раньше жила в adminNotes)
        adminPrivateNote: "",

        createdAt: serverTimestamp()
      };

      await runTransaction(db, async (tx) => {
        const existing = await tx.get(callsignRef);
        if (existing.exists()) throw new Error("Этот позывной уже занят, выберите другой.");
        tx.set(callsignRef, { uid });
        tx.set(doc(db, "profiles", uid), profileData);
        tx.set(doc(db, "rosterPublic", uid), buildRosterPublicPayload(profileData));
      });

      await refreshProfile();
      navigate("/profile");
    } catch (err) {
      setError(err.message || "Ошибка при регистрации.");
      setSubmitting(false);
    }
  }

  return (
    <main className="container">
      <h1>Заявка на вступление</h1>
      <p className="page-lead">
        <b>Добро пожаловать в ряды, боец!</b> Полную анкету видят только командир батальона и его заместители.
      </p>
      <ApplicationForm onSubmit={handleSubmit} submitLabel="Отправить заявку" showAccountFields={true} submitting={submitting} externalError={error} />
    </main>
  );
}
