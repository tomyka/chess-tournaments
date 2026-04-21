// Exported utility functions for testing (extracted from scraper.ts logic)

export function parseTimeControl(
  code: string
): "STANDARD" | "RAPID" | "BLITZ" | "UNKNOWN" {
  switch (code.trim().toLowerCase()) {
    case "st":
      return "STANDARD";
    case "rp":
      return "RAPID";
    case "bz":
      return "BLITZ";
    default:
      return "UNKNOWN";
  }
}

export function parseStatus(
  lastUpdate: string
): "NOT_STARTED" | "IN_PROGRESS" | "FINISHED" {
  if (!lastUpdate || lastUpdate.trim() === "") return "NOT_STARTED";
  return "FINISHED";
}
