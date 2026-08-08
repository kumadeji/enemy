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

function CompositionLabel({ name, count, color }) {
  return (
    <div className="stats-compact-node">
      <span className="badge" style={{ color, borderColor: color }}>
        {name}
      </span>
      <span className="stats-compact-count">{count}</span>
    </div>
  );
}

function PositionLabel({ name, count, color }) {
  return (
    <div className="stats-compact-node">
      <span className="badge" style={{ color, borderColor: color }}>
        {name}
      </span>
      <span className="stats-compact-count">{count}</span>
    </div>
  );
}

function SquadLeaderLabel({ count }) {
  return (
    <div className="stats-compact-node stats-compact-squad">
      <span className="badge squad-leader-badge">
        {pluralize(count, SQUAD_LEADER_FORMS)}
      </span>
      <span className="stats-compact-count">{count}</span>
    </div>
  );
}

function RootLabel({ total, game }) {
  return (
    <div className="stats-compact-root">
      <span className="stats-compact-root-number">{total}</span>
      <span className="stats-compact-root-text">Всего бойцов в клане</span>
      <span className="stats-compact-root-game">по игре: <b>{game}</b></span>
    </div>
  );
}

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
      <div className="stats-tree-scroll">
        <Tree
          lineWidth="2px"
          lineColor="var(--border)"
          lineBorderRadius="8px"
          label={<RootLabel total={total} game={game} />}
        >
          {compositions.map(({ composition, total: branchTotal, positions }) => {
            const compColor = getCompositionColor(composition);
            return (
              <TreeNode
                key={composition}
                label={
                  <CompositionLabel 
                    name={composition} 
                    count={branchTotal} 
                    color={compColor} 
                  />
                }
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
                      label={
                        <PositionLabel 
                          name={label} 
                          count={count} 
                          color={posColor} 
                        />
                      }
                    />
                  );
                })}
              </TreeNode>
            );
          })}

          {squadLeadersCount > 0 && (
            <TreeNode
              label={<SquadLeaderLabel count={squadLeadersCount} />}
            />
          )}
        </Tree>
      </div>
    </div>
  );
}