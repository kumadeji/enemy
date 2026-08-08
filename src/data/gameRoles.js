export const GAMES = ["Arma Reforger", "Squad"];

export const COMPOSITIONS_ORDER = ["Личный состав", "Запас", "Отбор", "Отставка"];

export const POSITIONS_BY_COMPOSITION = {
  "Отбор": ["Новобранец"],
  "Запас": ["Боец"],
  "Личный состав": ["Боец", "Почётный боец", "Зам. командира батальона", "Командир батальона"],
  "Отставка": ["Дезертир", "Бывший боец"]
};

export const COMPOSITION_RANK = {
  "Личный состав": 1,
  "Запас": 2,
  "Отбор": 3,
  "Отставка": 4
};

export const POSITION_RANK = {
  "Командир батальона": 1,
  "Зам. командира батальона": 2,
  "Почётный боец": 3,
  "Боец": 4,
  "Новобранец": 5,
  "Дезертир": 6,
  "Бывший боец": 6
};

// Склонение должностей по числу: [именительный ед. / родительный ед. / родительный мн.]
// "Зам. командира батальона" оставлен неизменяемым во всех формах — это
// устойчивая аббревиатура-титул, склонение которой звучало бы неестественно.
export const POSITION_FORMS = {
  "Боец": ["Боец", "Бойца", "Бойцов"],
  "Почётный боец": ["Почётный боец", "Почётного бойца", "Почётных бойцов"],
  "Командир батальона": ["Командир батальона", "Командира батальона", "Командиров батальона"],
  "Зам. командира батальона": ["Зам. командира батальона", "Зам. командира батальона", "Зам. командира батальона"],
  "Новобранец": ["Новобранец", "Новобранца", "Новобранцев"],
  "Дезертир": ["Дезертир", "Дезертира", "Дезертиров"],
  "Бывший боец": ["Бывший боец", "Бывшего бойца", "Бывших бойцов"]
};

export const SQUAD_LEADER_FORMS = ["Командир отделения", "Командира отделения", "Командиров отделения"];

// Отдельная палитра для СОСТАВОВ — не пересекается с палитрой должностей
export const COMPOSITION_COLORS = {
  "Личный состав": "#d69e2e",
  "Запас": "#4caf6d",
  "Отбор": "#5b8fd6",
  "Отставка": "#6b7076"
};

// Отдельная палитра для ДОЛЖНОСТЕЙ
export const POSITION_COLORS = {
  "Командир батальона": "#e05252",
  "Зам. командира батальона": "#e0824f",
  "Почётный боец": "#dfc94a",
  "Боец": "#4bb8c4",
  "Новобранец": "#9aa0a6",
  "Дезертир": "#7c828a",
  "Бывший боец": "#7c828a"
};

export function getCompositionColor(composition) {
  return COMPOSITION_COLORS[composition] || "#9aa0a6";
}

export function getPositionColor(position) {
  return POSITION_COLORS[position] || "#9aa0a6";
}

export function defaultGameRole() {
  return { composition: "Отбор", position: "Новобранец", isSquadLeader: false };
}

export function hasRosterAccess(gameRole) {
  if (!gameRole) return false;
  return gameRole.composition === "Запас" || gameRole.composition === "Личный состав";
}

export function isHiddenComposition(composition) {
  return composition === "Отставка";
}

export function canBeSquadLeader(composition) {
  return composition === "Запас" || composition === "Личный состав";
}
