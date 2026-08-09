export function isActionActive(action) {
  return action.expiresAtMs > Date.now();
}

export function getActiveActions(actions = []) {
  return actions.filter(isActionActive);
}

// scope: "global" — общее для всего сообщества, либо название игры (например, "Arma Reforger")
export function createAction(type, reason, scope) {
  const now = Date.now();
  const durationMs = type === "Выговор"
    ? 3 * 30 * 24 * 60 * 60 * 1000
    : 30 * 24 * 60 * 60 * 1000;

  return {
    id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    reason,
    scope,
    issuedAtMs: now,
    expiresAtMs: now + durationMs
  };
}
