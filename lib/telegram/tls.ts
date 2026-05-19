import { execSync } from "node:child_process";
import { existsSync } from "node:fs";

/**
 * Node on macOS + conda often lacks trusted CAs → UNABLE_TO_GET_ISSUER_CERT_LOCALLY
 * when calling api.telegram.org. Call once before any Telegram HTTP requests.
 */
export function configureNodeTls(): void {
  if (process.env.NODE_EXTRA_CA_CERTS?.trim()) return;

  const candidates: string[] = [];

  try {
    const certifi = execSync("python -m certifi", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (certifi && existsSync(certifi)) candidates.push(certifi);
  } catch {
    // certifi not available
  }

  for (const path of [
    "/opt/homebrew/etc/openssl@3/cert.pem",
    "/usr/local/etc/openssl@3/cert.pem",
    "/etc/ssl/cert.pem",
  ]) {
    if (existsSync(path)) candidates.push(path);
  }

  if (candidates.length > 0) {
    process.env.NODE_EXTRA_CA_CERTS = candidates[0];
  }
}
