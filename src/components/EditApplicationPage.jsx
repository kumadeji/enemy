import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db, GOOGLE_SHEETS_URL } from "../firebase";
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import ApplicationForm, { buildSteamProfileUrl } from "./ApplicationForm";
import { buildTelegramUrl, buildVkUrl } from "../utils/socialLinks";

const FIELD_LABELS = {
  fullName: "Имя и фамилия", age: "Возраст", birthDate: "Дата рождения",
  steamId: "Steam ID", discordId: "Discord ID", armaId: "Arma ID",
  extraPhone: "Телефон", extraTelegram: "ID Telegram", extraVk: "ID ВКонтакте", extraOther: "Другой контакт",
  timezone: "Часовой пояс", availability: "Доступность для игр",
  whyJoin: "Почему хочет вступить", howFound: "Откуда узнал о клане", gamesInterested: "Игры"
};

function buildChangesList(before, after) {
  const changes = [];
  for (const field of Object.keys(FIELD_LABELS)) {
    const oldVal = Array.isArray(before[field]) ? before[field].join(", ") : (before[field] ?? "");
    const newVal = Array.isArray(after[field]) ? after[field].join(", ") : (after[field] ?? "");
    if (String(oldVal) !== String(newVal)) {
      changes.push({ field: FIELD_LABELS[field], oldValue: String(oldVal) || "—", newValue: String(newVal) || "—" });
    }
  }
  return changes;
}

export default function EditApplicationPage({ targetUid, isAdminEditing = false }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [application, setApplication] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const pSnap = await getDoc(doc(db, "profiles", targetUid));
      const aSnap = await getDoc(doc(db, "applications", targetUid));
      if (pSnap.exists()) setProfile(pSnap.data());
      if (aSnap.exists()) setApplication(aSnap.data());
    }
    if (targetUid) load();
  }, [targetUid]);

  if (!profile || !application) return <main className="container"><p>Загрузка...</p></main>;

  const initialValues = {
    email: application.email, fullName: application.fullName, age: String(application.age),
    birthDate: profile.birthDate || "",
    steamId: profile.steamId, discordId: profile.discordId, armaId: profile.armaId || "",
    extraPhone: profile.extraContacts?.phone || "",
    extraTelegram: profile.extraContacts?.telegram || "",
    extraVk: profile.extraContacts?.vk || "",
    extraOther: profile.extraContacts?.other || "",
    callsign: profile.callsign,
    timezone: profile.timezone,
    availability: application.availability,
    whyJoin: application.whyJoin,
    howFound: application.howFound || "",
    referredByUid: profile.referredByUid || "",
    charterAgreed: application.charterAgreed,
    games: profile.gamesInterested,
    gameDetails: Object.fromEntries(
      profile.gamesInterested.map(g => [g, {
        hours: String(application.hoursByGame?.[g] || ""),
        experience: application.experienceByGame?.[g] || ""
      }])
    )
  };

  async function handleSave(values) {
    setSubmitting(true);
    setError("");
    try {
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
      const steamProfileUrl = buildSteamProfileUrl(values.steamId);
      const telegramUrl = buildTelegramUrl(values.extraTelegram);
      const vkUrl = buildVkUrl(values.extraVk);

      const beforeFlat = {
        fullName: application.fullName, age: application.age, birthDate: profile.birthDate,
        steamId: profile.steamId, discordId: profile.discordId, armaId: profile.armaId,
        extraPhone: profile.extraContacts?.phone, extraTelegram: profile.extraContacts?.telegram,
        extraVk: profile.extraContacts?.vk, extraOther: profile.extraContacts?.other,
        timezone: profile.timezone, availability: application.availability,
        whyJoin: application.whyJoin, howFound: application.howFound,
        gamesInterested: profile.gamesInterested
      };
      const afterFlat = {
        fullName: values.fullName, age: values.age, birthDate: values.birthDate,
        steamId: values.steamId, discordId: values.discordId, armaId: values.armaId,
        extraPhone: values.extraPhone, extraTelegram: values.extraTelegram,
        extraVk: values.extraVk, extraOther: values.extraOther,
        timezone: values.timezone, availability: values.availability,
        whyJoin: values.whyJoin, howFound: values.howFound,
        gamesInterested: values.games
      };
      const changes = buildChangesList(beforeFlat, afterFlat);

      await updateDoc(doc(db, "applications", targetUid), {
        fullName: values.fullName, age: Number(values.age),
        availability: values.availability, whyJoin: values.whyJoin,
        howFound: values.referralType === "text" ? values.howFound : "",
        referrerCallsign: values.referrerCallsign || "",
        hoursByGame, experienceByGame
      });

      await updateDoc(doc(db, "profiles", targetUid), {
        discordId: values.discordId, steamId: values.steamId, steamProfileUrl,
        armaId: values.games.includes("Arma Reforger") ? values.armaId : "",
        extraContacts, telegramUrl, vkUrl,
        gamesInterested: values.games,
        timezone: values.timezone, birthDate: values.birthDate || "",
        referredByUid: values.referralType === "player" ? values.referredByUid : "",
        referredByText: values.referralType === "text" ? values.howFound : ""
      });

      await updateDoc(doc(db, "rosterPublic", targetUid), {
        gamesInterested: values.games,
        referredByUid: values.referralType === "player" ? values.referredByUid : ""
      });

      if (changes.length > 0) {
        await addDoc(collection(db, "changeLog"), {
          uid: targetUid, callsign: profile.callsign,
          changedBy: isAdminEditing ? "admin" : "player",
          changes, createdAt: serverTimestamp()
        });
      }

      if (GOOGLE_SHEETS_URL) {
        fetch(GOOGLE_SHEETS_URL, {
          method: "POST",
          body: JSON.stringify({
            action: "update", uid: targetUid,
            callsign: profile.callsign, email: application.email, fullName: values.fullName, age: values.age,
            steamProfileUrl, discordId: values.discordId, armaId: values.armaId,
            extraContacts, gamesInterested: values.games, timezone: values.timezone,
            availability: values.availability, whyJoin: values.whyJoin,
            howFound: values.referralType === "player" ? `Приглашён бойцом: ${values.referrerCallsign}` : values.howFound,
            charterAgreed: values.charterAgreed
          })
        }).catch(() => {});
      }

      navigate(isAdminEditing ? `/admin/player/${targetUid}` : "/profile");
    } catch (err) {
      setError(err.message || "Ошибка при сохранении.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="container">
      <h1>Редактирование анкеты</h1>
      <ApplicationForm
        initialValues={initialValues}
        onSubmit={handleSave}
        submitLabel="Сохранить изменения"
        showAccountFields={false}
        lockedFields={["callsign"]}
        submitting={submitting}
        externalError={error}
      />
    </main>
  );
}
