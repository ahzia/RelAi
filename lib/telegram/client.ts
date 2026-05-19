import { readFileSync, existsSync } from "node:fs";
import { Agent as HttpsAgent } from "node:https";
import { configureNodeTls } from "./tls";

/**
 * grammY on Node uses node-fetch, which does not pick up NODE_EXTRA_CA_CERTS
 * unless we pass an explicit https.Agent (common with conda / corporate SSL).
 */
export function getGrammyClientOptions():
  | { baseFetchConfig: { agent: HttpsAgent } }
  | undefined {
  configureNodeTls();

  if (process.env.TELEGRAM_INSECURE_SSL === "true") {
    return {
      baseFetchConfig: {
        agent: new HttpsAgent({ rejectUnauthorized: false }),
      },
    };
  }

  const caPath = process.env.NODE_EXTRA_CA_CERTS?.trim();
  if (!caPath || !existsSync(caPath)) return undefined;

  const agent = new HttpsAgent({ ca: readFileSync(caPath) });
  return { baseFetchConfig: { agent } };
}
