export function isActionActive(action) {
  return action.expiresAtMs > Date.now();
}

export function getActiveActions(actions = []) {
  return actions.filter(isActionActive);
}

export function createAction(type, reason) {
  const now = Date.now();
  const durationMs = type === "Выговор"
    ? 3 * 30 * 24 * 60 * 60 * 1000  // 3 месяца
    : 30 * 24 * 60 * 60 * 1000;      // 1 месяц

  return {
    id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    reason,
    issuedAtMs: now,
    expiresAtMs: now + durationMs
  };
}
