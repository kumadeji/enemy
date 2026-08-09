import { useState, useEffect } from "react";

export default function AwardChip({ icon, name, description, scopeLabel }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function handleKey(e) { if (e.key === "Escape") setOpen(false); }
    window.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <span className="award-chip">
        <span className="award-chip-icon">{icon}</span>
        <span className="award-chip-text">{name}</span>
        {scopeLabel && <span className="award-scope-tag">{scopeLabel}</span>}
        {description && (
          <button type="button" className="award-chip-info-btn" onClick={() => setOpen(true)} aria-label={`Подробнее: ${name}`}>?</button>
        )}
      </span>

      {open && (
        <div className="image-modal-overlay" onClick={() => setOpen(false)}>
          <div className="image-modal-content award-modal-content" onClick={e => e.stopPropagation()}>
            <button className="image-modal-close" onClick={() => setOpen(false)}>✕</button>
            <h3 className="award-modal-title">{icon} {name}</h3>
            <p className="award-modal-description">{description}</p>
          </div>
        </div>
      )}
    </>
  );
}
