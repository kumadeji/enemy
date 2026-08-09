import { isActionActive } from "../utils/discipline";

export default function DisciplinaryList({ actions = [], showHistory = false, onRemove }) {
  const list = showHistory ? actions : actions.filter(isActionActive);
  if (list.length === 0) return null;

  return (
    <div className="disciplinary-box">
      <div className="disciplinary-title">Дисциплинарные взыскания</div>
      {list.map(a => (
        <div key={a.id} className={`disciplinary-item ${isActionActive(a) ? "" : "disciplinary-expired"}`}>
          <div className="disciplinary-item-row">
            <span><b>{a.type}</b> — {a.reason}</span>
            {onRemove && (
              <button type="button" className="btn-mini disciplinary-remove-btn" onClick={() => onRemove(a.id)}>Снять</button>
            )}
          </div>
          <div className="disciplinary-meta">
            выдано {new Date(a.issuedAtMs).toLocaleDateString("ru-RU")},
            {" "}{isActionActive(a) ? "действует до" : "истекло"} {new Date(a.expiresAtMs).toLocaleDateString("ru-RU")}
          </div>
        </div>
      ))}
    </div>
  );
}
