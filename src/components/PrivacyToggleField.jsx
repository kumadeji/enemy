export default function PrivacyToggleField({ isPublic, onToggle, children }) {
  return (
    <span className="privacy-toggle-field">
      <span>{children}</span>
      <button
        type="button"
        className={`icon-square-btn eye-toggle-btn ${isPublic ? "will-hide" : "will-show"}`}
        onClick={onToggle}
        title={isPublic ? "Видно всем бойцам — нажмите, чтобы скрыть" : "Видно только комбату и его заместителям — нажмите, чтобы открыть всем"}
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        {!isPublic && <span className="eye-strike" />}
      </button>
    </span>
  );
}
