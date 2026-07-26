import { STATUS_ORDER } from "../firebase";

export default function CommunityStats({ profiles }) {
  const total = profiles.length;
  const squadLeaders = profiles.filter(p => p.isSquadLeader).length;
  const byStatus = STATUS_ORDER.reduce((acc, s) => {
    acc[s] = profiles.filter(p => p.status === s).length;
    return acc;
  }, {});

  return (
    <div className="community-stats card">
      <div className="stat-block">
        <span className="stat-value">{total}</span>
        <span className="stat-label">Всего бойцов</span>
      </div>
      <div className="stat-block">
        <span className="stat-value">{squadLeaders}</span>
        <span className="stat-label">Командиров отряда</span>
      </div>
      {STATUS_ORDER.filter(s => s !== "Дезертир").map(s => (
        <div className="stat-block" key={s}>
          <span className="stat-value">{byStatus[s] || 0}</span>
          <span className="stat-label">{s}</span>
        </div>
      ))}
    </div>
  );
}
