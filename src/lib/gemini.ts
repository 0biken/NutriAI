import { GoogleGenAI } from "@google/genai";

// Ensure we only initialize this on the server
if (typeof window !== "undefined") {
  throw new Error("Gemini API client can only be used on the server");
}

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not defined in environment variables");
}

export const ai = new GoogleGenAI({ apiKey });
