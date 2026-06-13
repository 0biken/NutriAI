import { GoogleGenAI } from "@google/genai";

// Ensure we only initialize this on the server
if (typeof window !== "undefined") {
  throw new Error("Gemini API client can only be used on the server");
}

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey && process.env.NODE_ENV !== "development" && process.env.NODE_ENV !== "test") {
  console.warn("GEMINI_API_KEY is not defined in environment variables. Gemini features will fail.");
}

export const ai = new GoogleGenAI({ apiKey: apiKey || "dummy-key-for-build" });
