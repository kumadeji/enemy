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

  const compositions = COMPOSITIONS_ORDER
    .map(composition => {
      const positions = POSITIONS_BY_COMPOSITION[composition]
        .map(position => ({ 
          position, 
          count: countByPosition(composition, position) 
        }))
        .filter(p => p.count > 0);
      const branchTotal = positions.reduce((sum, p) => sum + p.count, 0);
      return { composition, total: branchTotal, positions };
    })
    .filter(c => c.total > 0);

  const squadLeadersCount = profilesForGame.filter(
    p => p.gameRoles?.[game]?.isSquadLeader
  ).length;

  return (
    <div className="community-stats-card card">
      <div className="stats-header">
        <div className="stats-total-block">
          <div className="stats-total-number">{total}</div>
          <div className="stats-total-label">Всего бойцов в клане</div>
        </div>
        <div className="stats-game-indicator">
          по игре: <b>{game}</b>
        </div>
      </div>

      <div className="stats-tree-wrapper">
        <div className="stats-tree">
          {compositions.map(({ composition, total: branchTotal, positions }) => {
            const compColor = getCompositionColor(composition);
            return (
              <div key={composition} className="stats-branch-column">
                {/* Состав */}
                <div className="stats-composition-node">
                  <span 
                    className="badge" 
                    style={{ color: compColor, borderColor: compColor }}
                  >
                    {composition}
                  </span>
                  <span className="stats-node-count">{branchTotal}</span>
                </div>

                {/* Вертикальная линия от состава к должностям */}
                <div className="stats-vertical-line"></div>

                {/* Должности */}
                <div className="stats-positions-container">
                  {positions.map(({ position, count }, index) => {
                    const posColor = getPositionColor(position);
                    const label = pluralize(
                      count, 
                      POSITION_FORMS[position] || [position, position, position]
                    );
                    return (
                      <div key={position} className="stats-position-item">
                        {/* Горизонтальная линия к должности */}
                        <div className="stats-horizontal-line"></div>
                        
                        <div className="stats-position-node">
                          <span 
                            className="badge" 
                            style={{ color: posColor, borderColor: posColor }}
                          >
                            {label}
                          </span>
                          <span className="stats-node-count">{count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Командиры отделения */}
        {squadLeadersCount > 0 && (
          <div className="stats-squad-leaders-column">
            <div className="stats-squad-leaders-node">
              <span className="badge squad-leader-badge">
                {pluralize(squadLeadersCount, SQUAD_LEADER_FORMS)}
              </span>
              <span className="stats-node-count">{squadLeadersCount}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}