import { useState, useEffect } from "react";

export default function AdminAwardChip({ icon, name, description, onRemove }) {
  const [infoOpen, setInfoOpen] = useState(false);

  useEffect(() => {
    if (!infoOpen) return;
    function handleKey(e) { if (e.key === "Escape") setInfoOpen(false); }
    window.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [infoOpen]);

  return (
    <>
      <span className="award-chip award-chip-admin">
        <span className="award-chip-icon">{icon}</span>
        <span className="award-chip-text">{name}</span>
        {description && (
          <button type="button" className="award-chip-info-btn" onClick={() => setInfoOpen(true)} aria-label={`Подробнее: ${name}`}>?</button>
        )}
        <button type="button" className="award-chip-remove-btn" onClick={onRemove} aria-label={`Изъять награду: ${name}`}>✕</button>
      </span>

      {infoOpen && (
        <div className="image-modal-overlay" onClick={() => setInfoOpen(false)}>
          <div className="image-modal-content award-modal-content" onClick={e => e.stopPropagation()}>
            <button className="image-modal-close" onClick={() => setInfoOpen(false)}>✕</button>
            <h3 className="award-modal-title">{icon} {name}</h3>
            <p className="award-modal-description">{description}</p>
          </div>
        </div>
      )}
    </>
  );
}
