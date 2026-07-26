export default function StatusBadges({ status, isSquadLeader }) {
  return (
    <span className="status-badges">
      <span className="badge" data-status={status}>{status}</span>
      {isSquadLeader && <span className="badge squad-leader-badge">Командир отряда</span>}
    </span>
  );
}
