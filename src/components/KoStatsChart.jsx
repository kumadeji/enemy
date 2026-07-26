export default function KoStatsChart({ data }) {
  const maxKo = Math.max(1, ...data.map(p => p.koCount || 0));
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="ko-stats-chart">
      {data.map((p, index) => {
        const value = p.koCount || 0;
        const percent = Math.round((value / maxKo) * 100);
        return (
          <div className="ko-stats-row" key={p.uid}>
            <div className="ko-stats-rank">{medals[index] || `#${index + 1}`}</div>
            <div className="ko-stats-name">{p.callsign}</div>
            <div className="ko-stats-track">
              <div className="ko-stats-fill" style={{ width: `${percent}%` }} />
            </div>
            <div className="ko-stats-value">{value}</div>
          </div>
        );
      })}
    </div>
  );
}
