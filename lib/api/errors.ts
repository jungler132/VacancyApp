export function describeSourceError(error: unknown): string {
  if (!error) return 'неизвестная ошибка';
  if (typeof error === 'object' && error !== null && 'name' in error && (error as { name?: string }).name === 'AbortError') {
    return 'нет ответа';
  }
  const message = error instanceof Error ? error.message : String(error);
  if (message === 'aborted') return 'отменено';
  if (message === 'timeout' || /timeout|timed out/i.test(message)) return 'нет ответа';
  if (/HTTP 403/.test(message) || /forbidden/i.test(message)) return 'доступ закрыт';
  if (/HTTP 429/.test(message)) return 'слишком много запросов';
  if (/HTTP 5\d\d/.test(message)) return 'сервер источника недоступен';
  if (/HTTP 410/.test(message)) return 'источник больше недоступен';
  if (/HTTP 404/.test(message)) return 'не найдено';
  if (/network|failed to fetch|network request failed/i.test(message)) return 'нет сети';
  if (/HTTP \d+/.test(message)) return message.replace('HTTP ', 'код ');
  return 'ошибка запроса';
}

export function isAbortError(error: unknown): boolean {
  if (!error) return false;
  if (typeof error === 'object' && error !== null && 'name' in error && (error as { name?: string }).name === 'AbortError') {
    return true;
  }
  return error instanceof Error && (error.message === 'aborted' || error.message === 'AbortError');
}
