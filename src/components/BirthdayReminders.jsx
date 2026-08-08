import { Link } from "react-router-dom";
import { getUpcomingBirthdays } from "../utils/birthdays";

export default function BirthdayReminders({ profiles }) {
  const upcoming = getUpcomingBirthdays(profiles, 30);
  if (upcoming.length === 0) return null;

  return (
    <div className="birthday-reminder card">
      <h2>🎉 Ближайшие дни рождения</h2>
      <ul>
        {upcoming.map(b => (
          <li key={b.uid}>
            <Link to={`/admin/player/${b.uid}`}>{b.callsign}</Link> —{" "}
            {b.daysUntil === 0 ? "сегодня!" : `через ${b.daysUntil} дн.`}
          </li>
        ))}
      </ul>
    </div>
  );
}
