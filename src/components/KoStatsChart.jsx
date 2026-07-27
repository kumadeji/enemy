export default function KoStatsChart({ data }) {
  const maxKo = Math.max(1, ...data.map(p => p.koCount || 0));
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <table className="ko-stats-table">
      <tbody>
        {data.map((p, index) => {
          const value = p.koCount || 0;
          const percent = Math.round((value / maxKo) * 100);
          return (
            <tr key={p.uid}>
              <td className="ko-stats-rank">{medals[index] || `#${index + 1}`}</td>
              <td className="ko-stats-name">{p.callsign}</td>
              <td className="ko-stats-track-cell">
                <div className="ko-stats-track">
                  <div className="ko-stats-fill" style={{ width: `${percent}%` }} />
                </div>
              </td>
              <td className="ko-stats-value">{value}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
