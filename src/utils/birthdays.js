export function getUpcomingBirthdays(profiles, daysAhead = 30) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const results = [];

  for (const p of profiles) {
    if (!p.birthDate) continue;
    const match = p.birthDate.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (!match) continue;
    const day = Number(match[1]);
    const month = Number(match[2]);

    let next = new Date(today.getFullYear(), month - 1, day);
    if (next < today) next = new Date(today.getFullYear() + 1, month - 1, day);

    const diffDays = Math.round((next - today) / (1000 * 60 * 60 * 24));
    if (diffDays <= daysAhead) {
      results.push({ uid: p.uid, callsign: p.callsign, daysUntil: diffDays });
    }
  }

  results.sort((a, b) => a.daysUntil - b.daysUntil);
  return results;
}
