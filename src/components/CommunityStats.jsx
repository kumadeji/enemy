import { COMPOSITIONS_ORDER, POSITIONS_BY_COMPOSITION } from "../data/gameRoles";
import { pluralize } from "../utils/pluralize";

// Простая функция плюрализации по общей форме "N/N/N" без сложных родов —
// для составов/должностей используем именительный падеж без склонения формы
// (склонения слишком разнообразны для новой системы — считаем как есть).
export default function CommunityStats({ allProfiles, game, profilesForGame }) {
  const total = allProfiles.length;

  const countFor = (composition, position) =>
    profilesForGame.filter(p => {
      const gr = p.gameRoles?.[game];
      return gr && gr.composition === composition && gr.position === position;
    }).length;

  const squadLeadersCount = profilesForGame.filter(p => p.gameRoles?.[game]?.isSquadLeader).length;

  return (
    <div className="community-stats-wrapper card">
      <div className="community-stats-section">
        <div className="community-stat-block">
          <span className="stat-value">{total}</span>
          <span className="stat-label">Всего бойцов на сайте</span>
        </div>
      </div>

      <div className="community-stats-divider" />

      <div className="community-stats-section-title">По игре: {game}</div>
      <div className="community-stats-section">
        <div className="community-stat-block">
          <span className="stat-value">{squadLeadersCount}</span>
          <span className="stat-label">Командиров отделения</span>
        </div>
        {COMPOSITIONS_ORDER.filter(c => c !== "Отставка").map(composition =>
          POSITIONS_BY_COMPOSITION[composition].map(position => (
            <div className="community-stat-block" key={composition + position}>
              <span className="stat-value">{countFor(composition, position)}</span>
              <span className="stat-label">{position}<br /><small>{composition}</small></span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
