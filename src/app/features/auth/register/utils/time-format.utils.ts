export function formatCountdown(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60).toString();
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
