// Parse duration strings like 1d, 6h, 30m into milliseconds.

export function parseDurationToMs(duration: string): number {
  const match = duration.trim().match(/^(\d+)([smhd])$/);
  if (!match) {
    return 24 * 60 * 60 * 1000;
  }

  const value = parseInt(match[1], 10);
  switch (match[2]) {
    case "s":
      return value * 1000;
    case "m":
      return value * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    case "d":
      return value * 24 * 60 * 60 * 1000;
    default:
      return 24 * 60 * 60 * 1000;
  }
}
