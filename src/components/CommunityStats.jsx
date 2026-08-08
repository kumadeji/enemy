import { Tree, TreeNode } from "react-organizational-chart";
import { pluralize } from "../utils/pluralize";
import {
  COMPOSITIONS_ORDER,
  POSITIONS_BY_COMPOSITION,
  POSITION_FORMS,
  SQUAD_LEADER_FORMS,
  getCompositionColor,
  getPositionColor
} from "../data/gameRoles";

function NodeLabel({ badge, count, color, dashed }) {
  return (
    <span className={`cs-node ${dashed ? "cs-node-dashed" : ""}`}>
      <span className="badge" style={{ color, borderColor: color }}>{badge}</span>
      <span className="cs-count">{count}</span>
    </span>
  );
}

function RootLabel({ count, game }) {
  return (
    <span className="cs-root">
      <span className="cs-root-num">{count}</span>
      <span className="cs-root-text">по игре: <b>{game}</b></span>
    </span>
  );
}

export default function CommunityStats({ allProfiles, game, profilesForGame }) {
  const totalAll = allProfiles.length;

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

  const totalInGame = profilesForGame.length;

  return (
    <div className="community-stats-card card">
      
      {/* Блок 1: Общая статистика сайта (статичная) */}
      <div className="cs-site-row">
        <span className="cs-site-num">{totalAll}</span>
        <span className="cs-site-text">Всего бойцов в клане</span>
      </div>

      <div className="cs-divider"></div>

      {/* Блок 2: Дерево по игре */}
      <div className="cs-tree-scroll">
        <Tree
          lineWidth="1px"
          lineColor="var(--border)"
          lineBorderRadius="4px"
          label={<RootLabel count={totalInGame} game={game} />}
        >
          {compositions.map(({ composition, total: branchTotal, positions }) => {
            const compColor = getCompositionColor(composition);
            return (
              <TreeNode
                key={composition}
                label={<NodeLabel badge={composition} count={branchTotal} color={compColor} />}
              >
                {positions.map(({ position, count }) => {
                  const posColor = getPositionColor(position);
                  const label = pluralize(
                    count, 
                    POSITION_FORMS[position] || [position, position, position]
                  );
                  return (
                    <TreeNode
                      key={position}
                      label={<NodeLabel badge={label} count={count} color={posColor} />}
                    />
                  );
                })}
              </TreeNode>
            );
          })}

          {squadLeadersCount > 0 && (
            <TreeNode
              label={
                <span className="cs-node cs-node-squad">
                  <span className="badge squad-leader-badge">
                    {pluralize(squadLeadersCount, SQUAD_LEADER_FORMS)}
                  </span>
                  <span className="cs-count">{squadLeadersCount}</span>
                </span>
              }
            />
          )}
        </Tree>
      </div>
    </div>
  );
}