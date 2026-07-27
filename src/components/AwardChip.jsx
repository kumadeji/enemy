export default function AwardChip({ icon, desc }) {
  return (
    <span className="award-chip">
      <span className="award-chip-icon">{icon}</span>
      <span className="award-chip-text">{desc}</span>
    </span>
  );
}
