import { STATUS_ORDER } from "../firebase";
import { pluralize } from "../utils/pluralize";
import { STATUS_FORMS, SQUAD_LEADER_FORMS } from "../data/statusForms";

export default function CommunityStats({ profiles }) {
  const total = profiles.length;
  const squadLeaders = profiles.filter(p => p.isSquadLeader).length;
  const byStatus = STATUS_ORDER.reduce((acc, s) => {
    acc[s] = profiles.filter(p => p.status === s).length;
    return acc;
  }, {});

  return (
    <div className="community-stats card">
      <div className="community-stat-block">
        <span className="stat-value">{total}</span>
        <span className="stat-label">Всего бойцов</span>
      </div>
      <div className="community-stat-block">
        <span className="stat-value">{squadLeaders}</span>
        <span className="stat-label">{pluralize(squadLeaders, SQUAD_LEADER_FORMS)}</span>
      </div>
      {STATUS_ORDER.filter(s => s !== "Дезертир").map(s => (
        <div className="community-stat-block" key={s}>
          <span className="stat-value">{byStatus[s] || 0}</span>
          <span className="stat-label">{pluralize(byStatus[s] || 0, STATUS_FORMS[s])}</span>
        </div>
      ))}
    </div>
  );
}
