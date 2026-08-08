import { getCompositionColor, getPositionColor } from "../data/gameRoles";

export default function StatusBadges({ gameRole }) {
  if (!gameRole) return null;
  const compColor = getCompositionColor(gameRole.composition);
  const posColor = getPositionColor(gameRole.position);

  return (
    <span className="status-badges">
      <span className="badge" style={{ color: compColor, borderColor: compColor }}>{gameRole.composition}</span>
      <span className="badge" style={{ color: posColor, borderColor: posColor }}>{gameRole.position}</span>
      {gameRole.isSquadLeader && <span className="badge squad-leader-badge">Командир отделения</span>}
    </span>
  );
}
