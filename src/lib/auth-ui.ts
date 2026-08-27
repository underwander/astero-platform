export function formatAuthCountdown(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const rest = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

export function safeSessionError(error: string | undefined, isRu: boolean) {
  if (error && /unauthorized|401/i.test(error)) {
    return isRu ? "Сессия завершена. Войдите снова." : "Your session has ended. Please sign in again.";
  }
  return error;
}
