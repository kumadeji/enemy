export function ProfileTable({ children }) {
  return <table className="profile-table"><tbody>{children}</tbody></table>;
}

export function ProfileRow({ label, children }) {
  return (
    <tr>
      <td className="profile-table-label">{label}</td>
      <td className="profile-table-value">{children}</td>
    </tr>
  );
}
