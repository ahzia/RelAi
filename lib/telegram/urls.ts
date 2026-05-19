/** Telegram inline URL buttons require public HTTPS (no localhost / http). */
export function canUseTelegramUrlButton(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1" || host === "::1") {
      return false;
    }
    if (host.endsWith(".local")) return false;
    return true;
  } catch {
    return false;
  }
}
