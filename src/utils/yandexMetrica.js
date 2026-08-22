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

/**
 * Отправляет событие с параметрами в Яндекс Метрику
 * @param {Object} paramsObj - Объект с параметрами
 */
export function sendYandexParams(paramsObj) {
  if (typeof window !== 'undefined' && window.ym) {
    try {
      window.ym(111634137, 'params', paramsObj);
      console.log(`[Yandex Metrica] Params sent:`, paramsObj);
    } catch (error) {
      console.error('[Yandex Metrica] Error sending params:', error);
    }
  }
}

/**
 * Отправляет доход по цели
 * @param {string} goalId - Идентификатор цели
 * @param {number} amount - Сумма дохода
 * @param {string} currency - Валюта (по умолчанию RUB)
 */
export function sendYandexRevenue(goalId, amount, currency = 'RUB') {
  if (typeof window !== 'undefined' && window.ym) {
    try {
      window.ym(111634137, 'reachGoal', goalId, { order_price: String(amount), currency });
      console.log(`[Yandex Metrica] Revenue sent: ${goalId} = ${amount} ${currency}`);
    } catch (error) {
      console.error('[Yandex Metrica] Error sending revenue:', error);
    }
  }
}
