// Список игр, поддерживаемых сайтом. Добавление новой игры в будущем —
// это точка расширения: тут добавляется игра, а также в правилах Firestore
// (см. ниже) и в COMPOSITIONS/POSITIONS при необходимости других иерархий.
export const GAMES = ["Arma Reforger", "Squad"];

// Составы — по убыванию значимости
export const COMPOSITIONS_ORDER = ["Личный состав", "Запас", "Отбор", "Отставка"];

// Должности, допустимые в каждом составе
export const POSITIONS_BY_COMPOSITION = {
  "Отбор": ["Новобранец"],
  "Запас": ["Боец"],
  "Личный состав": ["Боец", "Почётный боец", "Зам. командира батальона", "Командир батальона"],
  "Отставка": ["Дезертир", "Бывший боец"]
};

// Ранг состава для сортировки (меньше = значимее)
export const COMPOSITION_RANK = {
  "Личный состав": 1,
  "Запас": 2,
  "Отбор": 3,
  "Отставка": 4
};

// Ранг должности внутри состава для сортировки (меньше = значимее)
export const POSITION_RANK = {
  "Командир батальона": 1,
  "Зам. командира батальона": 2,
  "Почётный боец": 3,
  "Боец": 4,
  "Новобранец": 5,
  "Дезертир": 6,
  "Бывший боец": 6
};

// Цвета бейджей по комбинации "состав|должность"
export const STATUS_COLORS = {
  "Отбор|Новобранец": "#9aa0a6",
  "Запас|Боец": "#4caf6d",
  "Личный состав|Боец": "#c9a227",
  "Личный состав|Почётный боец": "#e0b830",
  "Личный состав|Зам. командира батальона": "#e05252",
  "Личный состав|Командир батальона": "#e05252",
  "Отставка|Дезертир": "#6b7076",
  "Отставка|Бывший боец": "#6b7076"
};

export function getStatusColor(composition, position) {
  return STATUS_COLORS[`${composition}|${position}`] || "#9aa0a6";
}

export function defaultGameRole() {
  return { composition: "Отбор", position: "Новобранец", isSquadLeader: false };
}

// Может ли пользователь с такой ролью в игре просматривать состав/профили этой игры
export function hasRosterAccess(gameRole) {
  if (!gameRole) return false;
  return gameRole.composition === "Запас" || gameRole.composition === "Личный состав";
}

// Скрыт ли состав от публичного просмотра
export function isHiddenComposition(composition) {
  return composition === "Отставка";
}

// "Командир отделения" доступен только для составов Запас/Личный состав
export function canBeSquadLeader(composition) {
  return composition === "Запас" || composition === "Личный состав";
}
