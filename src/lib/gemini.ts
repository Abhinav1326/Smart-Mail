import { GoogleGenerativeAI } from "@google/generative-ai";

// Ordered list of preferred / fallback models. New primary: gemini-2.5-flash-lite
const FALLBACK_MODELS = [
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
  // Additional potential newer variants if released (harmless if not found; will fall through):
  "gemini-2.5-flash-latest",
  "gemini-2.0-flash",
  "gemini-2.0-flash-latest",
  // Previous generation fallbacks:
  "gemini-1.5-flash-latest",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
  "gemini-1.5-pro-latest",
  "gemini-1.0-pro",
];

export function getGeminiModel(requestedModel?: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const envModel = process.env.GEMINI_MODEL?.trim();
  const primary = requestedModel?.trim() || envModel || FALLBACK_MODELS[0];
  const tried: string[] = [];
  const genAI = new GoogleGenerativeAI(apiKey);

  function attempt(modelName: string) {
    tried.push(modelName);
    return genAI.getGenerativeModel({ model: modelName });
  }

  // We don't actually call the API here, just return the first candidate model.
  // The analyze route can catch a 404 and optionally retry by calling this again with the next preferred model.
  return attempt(primary);
}

export function getNextFallbackModel(previous: string | undefined) {
  if (!previous) return FALLBACK_MODELS[0];
  const idx = FALLBACK_MODELS.indexOf(previous);
  if (idx === -1) return FALLBACK_MODELS[0];
  return FALLBACK_MODELS[idx + 1];
}
