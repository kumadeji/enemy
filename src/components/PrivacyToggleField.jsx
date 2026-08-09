export default function PrivacyToggleField({ isPublic, canToggle, onToggle, children }) {
  return (
    <span className="privacy-toggle-field">
      <span>{children}</span>
      {canToggle && (
        <button
          type="button"
          className={`eye-toggle-btn ${!isPublic ? "is-private" : ""}`}
          onClick={onToggle}
          title={isPublic ? "Видно всем бойцам — нажмите, чтобы скрыть" : "Видно только комбату и его заместителям — нажмите, чтобы открыть всем"}
        >
          👁
        </button>
      )}
    </span>
  );
}
