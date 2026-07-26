export function formatBirthDateInput(value) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length > 4) return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`;
  if (digits.length > 2) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  return digits;
}

export function validateBirthDate(value) {
  if (!value.trim()) return null;
  const match = value.trim().match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!match) return "Дата рождения должна быть в формате ДД.ММ.ГГГГ.";
  const dd = Number(match[1]), mm = Number(match[2]), yyyy = Number(match[3]);
  if (mm < 1 || mm > 12) return "Некорректный месяц.";
  const daysInMonth = new Date(yyyy, mm, 0).getDate();
  if (dd < 1 || dd > daysInMonth) return "Некорректный день месяца.";
  const currentYear = new Date().getFullYear();
  if (yyyy < currentYear - 100 || yyyy > currentYear - 5) return "Проверьте год рождения.";
  return null;
}
