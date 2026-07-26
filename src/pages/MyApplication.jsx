import { useEffect, useState } from "react";
import { db, GOOGLE_SHEETS_URL } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import ApplicationForm, { buildSteamProfileUrl } from "../components/ApplicationForm";

export default function MyApplication() {
  const { currentUser, profile, refreshProfile } = useAuth();
  const [application, setApplication] = useState(null);
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const snap = await getDoc(doc(db, "applications", currentUser.uid));
      if (snap.exists()) setApplication(snap.data());
    }
    if (currentUser) load();
  }, [currentUser]);

  if (!profile || !application) {
    return <main className="container"><p>Загрузка...</p></main>;
  }

  const initialValues = {
    email: application.email, fullName: application.fullName, age: String(application.age),
    birthDate: application.birthDate || "",
    steamId: application.steamId, discordId: application.discordId, armaId: application.armaId || "",
    extraPhone: application.extraContacts?.phone || "",
    extraTelegram: application.extraContacts?.telegram || "",
    extraVk: application.extraContacts?.vk || "",
    extraOther: application.extraContacts?.other || "",
    callsign: profile.callsign,
    timezone: application.timezone,
    availability: application.availability,
    whyJoin: application.whyJoin, howFound: application.howFound,
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

      await updateDoc(doc(db, "applications", currentUser.uid), {
        fullName: values.fullName, age: Number(values.age), birthDate: values.birthDate || "",
        steamId: values.steamId, steamProfileUrl,
        discordId: values.discordId, armaId: values.armaId || "",
        extraContacts, hoursByGame, experienceByGame,
        timezone: values.timezone, availability: values.availability,
        whyJoin: values.whyJoin, howFound: values.howFound
      });

      await updateDoc(doc(db, "profiles", currentUser.uid), {
        discordId: values.discordId, steamId: values.steamId, steamProfileUrl,
        armaId: values.games.includes("Arma Reforger") ? values.armaId : "",
        extraContacts, gamesInterested: values.games,
        timezone: values.timezone, birthDate: values.birthDate || ""
      });

      await refreshProfile();
      setApplication(prev => ({ ...prev, ...values, extraContacts, hoursByGame, experienceByGame, steamProfileUrl }));

      if (GOOGLE_SHEETS_URL) {
        fetch(GOOGLE_SHEETS_URL, {
          method: "POST",
          body: JSON.stringify({
            action: "update", uid: currentUser.uid,
            callsign: profile.callsign, email: application.email, fullName: values.fullName, age: values.age,
            steamProfileUrl, discordId: values.discordId, armaId: values.armaId,
            extraContacts, gamesInterested: values.games, timezone: values.timezone,
            availability: values.availability, whyJoin: values.whyJoin, howFound: values.howFound,
            charterAgreed: values.charterAgreed
          })
        }).catch(() => {});
      }

      setEditing(false);
    } catch (err) {
      setError(err.message || "Ошибка при сохранении.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="container">
      <h1>Моя заявка</h1>

      <div className="card">
        {profile.status === "Новобранец" ? (
          <p>Ваша заявка на вступление получена и находится на рассмотрении администрации. Ожидайте — обычно это занимает некоторое время.</p>
        ) : (
          <p>Ваша заявка была рассмотрена. Текущий статус: <b>{profile.status}</b>.</p>
        )}
      </div>

      {!editing ? (
        <div className="card">
          <h2>Содержание заявки</h2>
          <p><b>Email:</b> {application.email}</p>
          <p><b>Имя и фамилия:</b> {application.fullName}</p>
          <p><b>Возраст:</b> {application.age}</p>
          {application.birthDate && <p><b>Дата рождения:</b> {application.birthDate}</p>}
          <p><b>Позывной:</b> {profile.callsign}</p>
          <p><b>Steam:</b> <a href={application.steamProfileUrl} target="_blank" rel="noreferrer">{application.steamProfileUrl}</a></p>
          <p><b>Discord ID:</b> {application.discordId}</p>
          {application.armaId && <p><b>Arma ID:</b> {application.armaId}</p>}
          <p><b>Игры:</b> {profile.gamesInterested.join(", ")}</p>
          {profile.gamesInterested.map(g => (
            <p key={g}><b>Опыт в {g}:</b> {application.hoursByGame?.[g]} ч. — {application.experienceByGame?.[g]}</p>
          ))}
          <p><b>Часовой пояс:</b> {application.timezone}</p>
          <p><b>Доступность:</b> {application.availability}</p>
          <p><b>Почему хочет вступить:</b> {application.whyJoin}</p>
          <p><b>Откуда узнал:</b> {application.howFound}</p>
          <button className="btn" onClick={() => setEditing(true)}>Внести изменения</button>
        </div>
      ) : (
        <ApplicationForm
          initialValues={initialValues}
          onSubmit={handleSave}
          submitLabel="Сохранить изменения"
          showAccountFields={false}
          lockedFields={["callsign"]}
          submitting={submitting}
          externalError={error}
        />
      )}
    </main>
  );
}
