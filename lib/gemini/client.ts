/**
 * Thin wrapper around @google/generative-ai.
 *
 * - Forces JSON output (`responseMimeType: "application/json"`)
 * - Parses the response and validates against a Zod schema
 * - One automatic retry on parse OR validation failure, asking the model to
 *   fix its output
 *
 * Usage from a prompt file:
 *
 *   const result = await callGemini({
 *     model: "flash",
 *     systemInstruction: "You extract structured profiles from onboarding answers.",
 *     userMessage: JSON.stringify(answers),
 *     schema: ProfileSchema,
 *   });
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ZodType } from "zod";

export type GeminiModel = "flash" | "pro";

export interface CallGeminiOptions<T> {
  model: GeminiModel;
  systemInstruction: string;
  userMessage: string;
  schema: ZodType<T>;
  /** 0–1, defaults to 0.4 (slightly creative but stable). */
  temperature?: number;
  /** Max retries on parse/validation failure. Defaults to 1. */
  maxRetries?: number;
}

function getModelId(model: GeminiModel): string {
  if (model === "flash") {
    return process.env.GEMINI_FLASH_MODEL ?? "gemini-2.5-flash";
  }
  return process.env.GEMINI_PRO_MODEL ?? "gemini-2.5-pro";
}

function getClient(): GoogleGenerativeAI {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to .env (get one at https://aistudio.google.com/app/apikey).",
    );
  }
  return new GoogleGenerativeAI(key);
}

export async function callGemini<T>(opts: CallGeminiOptions<T>): Promise<T> {
  const {
    model,
    systemInstruction,
    userMessage,
    schema,
    temperature = 0.4,
    maxRetries = 1,
  } = opts;

  const genAI = getClient();
  const m = genAI.getGenerativeModel({
    model: getModelId(model),
    systemInstruction,
    generationConfig: {
      responseMimeType: "application/json",
      temperature,
    },
  });

  let lastError: unknown;
  let lastRawText: string | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const prompt =
      attempt === 0
        ? userMessage
        : [
            userMessage,
            "",
            "Your previous response was invalid. Error:",
            String(lastError),
            "",
            "Previous output:",
            lastRawText ?? "(empty)",
            "",
            "Return only valid JSON matching the requested schema. No prose, no markdown.",
          ].join("\n");

    try {
      const result = await m.generateContent(prompt);
      lastRawText = result.response.text();
      const parsed = JSON.parse(lastRawText);
      return schema.parse(parsed);
    } catch (err) {
      lastError = err;
      if (attempt === maxRetries) {
        throw new Error(
          `callGemini(${model}) failed after ${attempt + 1} attempt(s): ${
            err instanceof Error ? err.message : String(err)
          }\nLast raw output: ${lastRawText?.slice(0, 500) ?? "(none)"}`,
        );
      }
    }
  }

  // Unreachable, but TypeScript wants it
  throw new Error("callGemini: exhausted retries without throwing — unreachable");
}
