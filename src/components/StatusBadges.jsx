import { getStatusColor } from "../data/gameRoles";

export default function StatusBadges({ gameRole }) {
  if (!gameRole) return null;
  const color = getStatusColor(gameRole.composition, gameRole.position);

  return (
    <span className="status-badges">
      <span className="badge" style={{ color, borderColor: color }}>{gameRole.composition}</span>
      <span className="badge" style={{ color, borderColor: color }}>{gameRole.position}</span>
      {gameRole.isSquadLeader && <span className="badge squad-leader-badge">Командир отделения</span>}
    </span>
  );
}
