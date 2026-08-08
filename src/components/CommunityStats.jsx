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

// Формы склонения для слова "боец" в разных контекстах
const COMMUNITY_FORMS = ["боец в мультиигровом сообществе", "бойца в мультиигровом сообществе", "бойцов в мультиигровом сообществе"];
const GAME_FORMS = ["боец, играющий в", "бойца, играющих в", "бойцов, играющих в"];

function NodeLabel({ badge, count, color, dashed }) {
  return (
    <div className="cs-node-box">
      <span className={`badge cs-badge ${dashed ? "cs-badge-dashed" : ""}`} style={{ color, borderColor: color }}>
        {badge}
      </span>
      <span className="cs-count">{count}</span>
    </div>
  );
}

function RootLabel({ count, game }) {
  const gameLabel = pluralize(count, GAME_FORMS);
  return (
    <div className="cs-node-box cs-root-box">
      <span className="cs-root-num">{count}</span>
      <span className="cs-root-text">{gameLabel} <b>{game}</b></span>
    </div>
  );
}

export default function CommunityStats({ allProfiles, game, profilesForGame }) {
  const totalAll = allProfiles.length;
  const totalInGame = profilesForGame.length;

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

  const communityLabel = pluralize(totalAll, COMMUNITY_FORMS);

  return (
    <div className="community-stats-card card">
      
      {/* Блок 1: Общая статистика сайта */}
      <div className="cs-site-row">
        <span className="cs-site-num">{totalAll}</span>
        <span className="cs-site-text">{communityLabel}</span>
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
                <NodeLabel 
                  badge={pluralize(squadLeadersCount, SQUAD_LEADER_FORMS)} 
                  count={squadLeadersCount} 
                  color="var(--accent)" 
                  dashed 
                />
              }
            />
          )}
        </Tree>
      </div>
    </div>
  );
}