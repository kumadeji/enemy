// Утилита для отправки событий в Яндекс Метрику
// Номер счетчика: 111634137

/**
 * Отправляет событие цели в Яндекс Метрику
 * @param {string} goalId - Идентификатор цели
 * @param {Object} params - Дополнительные параметры события
 */
export function sendYandexGoal(goalId, params = {}) {
  if (typeof window !== 'undefined' && window.ym) {
    try {
      window.ym(111634137, 'reachGoal', goalId, params);
      console.log(`[Yandex Metrica] Goal sent: ${goalId}`, params);
    } catch (error) {
      console.error('[Yandex Metrica] Error sending goal:', error);
    }
  }
}