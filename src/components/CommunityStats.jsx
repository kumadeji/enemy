import { pluralize } from "../utils/pluralize";
import {
  COMPOSITIONS_ORDER,
  POSITIONS_BY_COMPOSITION,
  POSITION_FORMS,
  SQUAD_LEADER_FORMS,
  getCompositionColor,
  getPositionColor
} from "../data/gameRoles";

export default function CommunityStats({ allProfiles, game, profilesForGame }) {
  const total = allProfiles.length;

  function countByPosition(composition, position) {
    return profilesForGame.filter(p => {
      const gr = p.gameRoles?.[game];
      return gr && gr.composition === composition && gr.position === position;
    }).length;
  }

  // Строим дерево, скрывая ветки/листья с нулевым количеством
  const compositions = COMPOSITIONS_ORDER
    .map(composition => {
      const positions = POSITIONS_BY_COMPOSITION[composition]
        .map(position => ({ position, count: countByPosition(composition, position) }))
        .filter(p => p.count > 0);
      const branchTotal = positions.reduce((sum, p) => sum + p.count, 0);
      return { composition, total: branchTotal, positions };
    })
    .filter(c => c.total > 0);

  const squadLeadersCount = profilesForGame.filter(p => p.gameRoles?.[game]?.isSquadLeader).length;

  return (
    <div className="community-stats-wrapper card">
      <div className="stats-tree-header">
        <div className="stats-tree-root">
          <span className="stat-value">{total}</span>
          <span className="stat-label">Всего бойцов в клане</span>
        </div>
        <div className="stats-tree-game-label">по игре: <b>{game}</b></div>
      </div>

      {/* Горизонтальный скролл именно этого блока на узких экранах */}
      <div className="stats-tree-scroll">
        <div className="stats-tree-body">
          <div className="stats-tree-compositions">
            {compositions.map(({ composition, total: branchTotal, positions }) => {
              const compColor = getCompositionColor(composition);
              return (
                <div className="stats-tree-branch" key={composition}>
                  <div className="stats-tree-node stats-tree-composition-node" style={{ borderColor: compColor, color: compColor }}>
                    <span className="stats-tree-node-count">{branchTotal}</span> {composition}
                  </div>
                  <div className="stats-tree-positions">
                    {positions.map(({ position, count }) => {
                      const posColor = getPositionColor(position);
                      const label = pluralize(count, POSITION_FORMS[position] || [position, position, position]);
                      return (
                        <div
                          className="stats-tree-node stats-tree-position-node"
                          key={position}
                          style={{ borderColor: posColor, color: posColor }}
                        >
                          <span className="stats-tree-node-count">{count}</span> {label}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {squadLeadersCount > 0 && (
            <div className="stats-tree-squad-leader">
              <span className="stat-value">{squadLeadersCount}</span>
              <span className="stat-label">{pluralize(squadLeadersCount, SQUAD_LEADER_FORMS)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
