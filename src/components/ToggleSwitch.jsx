export default function ToggleSwitch({ checked, onChange, label }) {
  return (
    <label className="toggle-switch-wrapper">
      <span className="toggle-switch">
        <input type="checkbox" checked={checked} onChange={onChange} />
        <span className="toggle-slider"></span>
      </span>
      <span className="toggle-switch-label">{label}</span>
    </label>
  );
}
