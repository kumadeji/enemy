import { useState, useEffect } from "react";

export default function ImageHint({ image, alt }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function handleKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="field-tooltip-btn"
        onClick={() => setOpen(true)}
        aria-label={`Показать подсказку: ${alt}`}
      >
        ?
      </button>

      {open && (
        <div className="image-modal-overlay" onClick={() => setOpen(false)}>
          <div className="image-modal-content" onClick={e => e.stopPropagation()}>
            <button className="image-modal-close" onClick={() => setOpen(false)} aria-label="Закрыть">✕</button>
            <img src={image} alt={alt} />
          </div>
        </div>
      )}
    </>
  );
}
