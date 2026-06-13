import { GoogleGenAI } from "@google/genai";

// Ensure we only initialize this on the server
if (typeof window !== "undefined") {
  throw new Error("Gemini API client can only be used on the server");
}

const apiKey = process.env.GEMINI_API_KEY || "dummy_key_for_build";

export const ai = new GoogleGenAI({ apiKey });
