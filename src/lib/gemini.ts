import { GoogleGenAI } from "@google/genai";

// Ensure we only initialize this on the server
if (typeof window !== "undefined") {
  throw new Error("Gemini API client can only be used on the server");
}

const apiKey = process.env.GEMINI_API_KEY || "dummy_key_for_build";

export const ai = new GoogleGenAI({ apiKey });

/**
 * Inspect an error thrown by the Gemini SDK and translate it into the
 * { status, body, headers } payload for a NextResponse.
 *
 * Specifically detects the free-tier RESOURCE_EXHAUSTED (HTTP 429) case
 * and surfaces a user-friendly "try again in Xs" message plus a
 * `Retry-After` header derived from the Gemini-supplied delay.
 */
export function classifyGeminiError(err: unknown, fallbackError: string): {
  status: number;
  body: { error: string; details: string; retryAfterSec?: number };
  headers?: Record<string, string>;
} {
  const raw = err instanceof Error ? err.message : String(err);

  // The SDK frequently embeds the upstream JSON inside the Error message.
  // Try parsing as-is, then fall back to extracting the trailing { ... } block.
  let inner: { error?: { code?: number; status?: string; message?: string } } | null = null;
  try {
    inner = JSON.parse(raw);
  } catch {
    const m = raw.match(/(\{[\s\S]*\})\s*$/);
    if (m) {
      try { inner = JSON.parse(m[1]); } catch { /* ignore */ }
    }
  }

  const code = inner?.error?.code;
  const status = inner?.error?.status;
  const upstreamMessage = inner?.error?.message ?? raw;

  if (code === 429 || status === "RESOURCE_EXHAUSTED") {
    const retryMatch = /retry in ([\d.]+)\s*s/i.exec(upstreamMessage);
    const retryAfterSec = retryMatch ? Math.max(1, Math.ceil(parseFloat(retryMatch[1]))) : 30;
    return {
      status: 429,
      body: {
        error: fallbackError,
        details: `NutriAI is at capacity right now. Please try again in about ${retryAfterSec} seconds.`,
        retryAfterSec,
      },
      headers: { "Retry-After": String(retryAfterSec) },
    };
  }

  return {
    status: 500,
    body: { error: fallbackError, details: raw },
  };
}
