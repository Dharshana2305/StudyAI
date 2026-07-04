import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("WARNING: GEMINI_API_KEY environment variable is not defined. AI features will fail. Please set it in AI Studio Secrets.");
}

export const ai = new GoogleGenAI({
  apiKey: apiKey || "MOCK_KEY",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

export const MODEL_NAME = 'gemini-3.5-flash';

/**
 * Clean and parse json response from Gemini
 */
export function parseGeminiJson<T>(text: string, fallback: T): T {
  try {
    // Remove markdown codeblock tags if present
    let cleanText = text.trim();
    if (cleanText.startsWith("```json")) {
      cleanText = cleanText.substring(7);
    } else if (cleanText.startsWith("```")) {
      cleanText = cleanText.substring(3);
    }
    if (cleanText.endsWith("```")) {
      cleanText = cleanText.substring(0, cleanText.length - 3);
    }
    cleanText = cleanText.trim();
    return JSON.parse(cleanText) as T;
  } catch (err) {
    console.error("Failed to parse Gemini JSON:", err, "Original text:", text);
    return fallback;
  }
}
