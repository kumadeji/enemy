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

      <div className="stats-tree">
        {/* Левая часть: дерево составов */}
        <div className="stats-branches">
          {compositions.map(({ composition, total: branchTotal, positions }) => {
            const compColor = getCompositionColor(composition);
            return (
              <div key={composition} className="stats-branch">
                {/* Линия от корня к составу */}
                <div className="stats-connector-top"></div>
                
                {/* Состав (бейдж как в таблице) */}
                <div className="stats-node">
                  <span 
                    className="badge stats-badge" 
                    style={{ color: compColor, borderColor: compColor }}
                  >
                    {composition}
                  </span>
                  <span className="stats-count">{branchTotal}</span>
                </div>

                {/* Должности под составом */}
                <div className="stats-positions-list">
                  {positions.map(({ position, count }) => {
                    const posColor = getPositionColor(position);
                    const label = pluralize(
                      count, 
                      POSITION_FORMS[position] || [position, position, position]
                    );
                    return (
                      <div key={position} className="stats-position-row">
                        {/* Горизонтальная линия к должности */}
                        <div className="stats-connector-side"></div>
                        
                        {/* Должность (бейдж как в таблице) */}
                        <span 
                          className="badge stats-badge" 
                          style={{ color: posColor, borderColor: posColor }}
                        >
                          {label}
                        </span>
                        <span className="stats-count">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Правая часть: Командиры отделения */}
        {squadLeadersCount > 0 && (
          <div className="stats-squad-leaders">
            <div className="stats-squad-leaders-box">
              <span className="badge squad-leader-badge">
                {pluralize(squadLeadersCount, SQUAD_LEADER_FORMS)}
              </span>
              <span className="stats-count">{squadLeadersCount}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}