// Сравнивает состояние профиля "до" и "после" правок администратора
// и формирует список человекочитаемых уведомлений об изменениях
export function buildDiffMessages(before, after, games) {
  const messages = [];

  for (const game of games) {
    const b = before.gameRoles?.[game];
    const a = after.gameRoles?.[game];
    if (b && a && (b.composition !== a.composition || b.position !== a.position)) {
      messages.push(`«${game}»: назначен состав «${a.composition}», должность «${a.position}».`);
    }
    if (b && a && !b.isSquadLeader && a.isSquadLeader) {
      messages.push(`«${game}»: вам присвоена должность «Командир отделения».`);
    }
    if (b && a && b.isSquadLeader && !a.isSquadLeader) {
      messages.push(`«${game}»: с вас снята должность «Командир отделения».`);
    }

    const bs = before.gameStats?.[game] || {};
    const as = after.gameStats?.[game] || {};
    if ((as.playedAsSoldierCount || 0) > (bs.playedAsSoldierCount || 0)) messages.push(`«${game}»: зачтён отыгрыш как боец.`);
    if ((as.koCount || 0) > (bs.koCount || 0)) messages.push(`«${game}»: зачтён отыгрыш за КО.`);
    if ((as.ksCount || 0) > (bs.ksCount || 0)) messages.push(`«${game}»: зачтён отыгрыш за КС.`);

    const bAwards = before.gameAwards?.[game] || [];
    const aAwards = after.gameAwards?.[game] || [];
    if (aAwards.length > bAwards.length) messages.push(`«${game}»: выдана награда «${aAwards[aAwards.length - 1].name}».`);

    const bActions = before.gameDisciplinaryActions?.[game] || [];
    const aActions = after.gameDisciplinaryActions?.[game] || [];
    if (aActions.length > bActions.length) messages.push(`«${game}»: выдано взыскание — ${aActions[aActions.length - 1].type}.`);
  }

  const bGlobalAwards = before.globalAwards || [];
  const aGlobalAwards = after.globalAwards || [];
  if (aGlobalAwards.length > bGlobalAwards.length) messages.push(`Выдана общая награда клана «${aGlobalAwards[aGlobalAwards.length - 1].name}».`);

  const bGlobalActions = before.globalDisciplinaryActions || [];
  const aGlobalActions = after.globalDisciplinaryActions || [];
  if (aGlobalActions.length > bGlobalActions.length) messages.push(`Выдано общее взыскание — ${aGlobalActions[aGlobalActions.length - 1].type}.`);

  return messages;
}
