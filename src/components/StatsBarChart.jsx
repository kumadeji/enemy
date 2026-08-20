export default function StatsBarChart({ data }) {
  if (data.length === 0) return <p className="hint">Пока нет данных.</p>;

  const maxValue = Math.max(1, ...data.map(p => p.value || 0));
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <table className="ko-stats-table">
      <tbody>
        {data.map((p, index) => {
          const percent = Math.round((p.value / maxValue) * 100);
          return (
            <tr key={p.uid}>
              <td className="ko-stats-rank">{medals[index] || `${index + 1}`}</td>
              <td className="ko-stats-name">{p.callsign}</td>
              <td className="ko-stats-track-cell">
                <div className="ko-stats-track">
                  <div className="ko-stats-fill" style={{ width: `${percent}%` }} />
                </div>
              </td>
              <td className="ko-stats-value">{p.value}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
