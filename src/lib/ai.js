/**
 * AI utility functions for LemonNote.
 * Makes calls to an OpenAI-compatible endpoint configured by the user.
 * All functions are pure and have no side effects (except fetch).
 */

import { readPref } from "./preferences";
import { toast } from "./toast";

const AI_ENABLED_KEY = "ai:enabled";
const AI_ENDPOINT_KEY = "ai:endpoint";
const AI_MODEL_KEY = "ai:model";
const AI_API_KEY_KEY = "ai:apiKey";

/**
 * Checks if AI feature is enabled and configured.
 */
export function isAIEnabled() {
  return readPref(AI_ENABLED_KEY, false) === true;
}

/**
 * Gets the AI configuration from preferences.
 */
export function getAIConfig() {
  return {
    enabled: readPref(AI_ENABLED_KEY, false),
    endpoint: readPref(AI_ENDPOINT_KEY, "https://api.openai.com/v1"),
    model: readPref(AI_MODEL_KEY, "gpt-4o-mini"),
    apiKey: readPref(AI_API_KEY_KEY, ""),
  };
}

/**
 * Saves AI configuration to preferences.
 */
export function setAIConfig(config) {
  if (config.enabled !== undefined) {
    window.localStorage.setItem(AI_ENABLED_KEY, String(config.enabled));
  }
  if (config.endpoint !== undefined) {
    window.localStorage.setItem(AI_ENDPOINT_KEY, config.endpoint);
  }
  if (config.model !== undefined) {
    window.localStorage.setItem(AI_MODEL_KEY, config.model);
  }
  if (config.apiKey !== undefined) {
    window.localStorage.setItem(AI_API_KEY_KEY, config.apiKey);
  }
  // Notify listeners
  window.dispatchEvent(new Event("prefs-changed"));
}

/**
 * Builds the prompt for a given AI action.
 */
export function buildPrompt(action, text, targetLanguage, noteLanguage) {
  const baseContext = `You are an AI assistant helping with a note-taking app. The user's note language is ${noteLanguage || "English"}.`;

  switch (action) {
    case "translate":
      return `${baseContext}\n\nTranslate the following text to ${targetLanguage}. Preserve markdown formatting, code blocks, and structure. Only return the translated text, no explanations.\n\n---\n${text}`;

    case "summarize":
      return `${baseContext}\n\nSummarize the following text concisely. Keep key points and structure. Use bullet points if appropriate. Only return the summary.\n\n---\n${text}`;

    case "fixGrammar":
      return `${baseContext}\n\nFix grammar, spelling, and punctuation in the following text. Preserve the original meaning, tone, and markdown formatting. Only return the corrected text.\n\n---\n${text}`;

    case "continue":
      return `${baseContext}\n\nContinue writing the following text naturally. Match the style, tone, and language. Only return the continuation (do not repeat the original text).\n\n---\n${text}`;

    case "arabicToEnglish":
      return `${baseContext}\n\nTranslate the following Arabic text to English. Preserve markdown formatting and structure. Only return the English translation.\n\n---\n${text}`;

    case "englishToArabic":
      return `${baseContext}\n\nTranslate the following English text to Arabic. Preserve markdown formatting and structure. Only return the Arabic translation.\n\n---\n${text}`;

    default:
      return `${baseContext}\n\n${text}`;
  }
}

/**
 * Makes an API call to the configured AI endpoint.
 * @param {string} prompt - The prompt to send
 * @param {Object} options - Additional options (temperature, maxTokens, etc.)
 * @returns {Promise<string>} The AI response text
 */
export async function callAI(prompt, options = {}) {
  const config = getAIConfig();

  if (!config.enabled) {
    throw new Error("AI is not enabled. Go to Settings > AI to configure it.");
  }

  if (!config.apiKey) {
    throw new Error("API key is not set. Go to Settings > AI to configure it.");
  }

  const endpoint = config.endpoint.replace(/\/$/, "");
  const url = `${endpoint}/chat/completions`;

  const body = {
    model: config.model,
    messages: [
      { role: "system", content: "You are a helpful assistant for a note-taking app." },
      { role: "user", content: prompt },
    ],
    temperature: options.temperature ?? 0.3,
    max_tokens: options.maxTokens ?? 2000,
    stream: false,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(message);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Empty response from AI");
    }

    return content.trim();
  } catch (err) {
    if (err instanceof TypeError && err.message.includes("fetch")) {
      throw new Error("Network error: Could not reach the AI endpoint. Check your internet connection and endpoint URL.");
    }
    throw err;
  }
}

/**
 * Tests the AI connection with a simple prompt.
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function testAIConnection() {
  const config = getAIConfig();

  if (!config.enabled) {
    return { success: false, message: "AI is not enabled." };
  }

  if (!config.endpoint) {
    return { success: false, message: "Endpoint URL is not set." };
  }

  if (!config.model) {
    return { success: false, message: "Model name is not set." };
  }

  if (!config.apiKey) {
    return { success: false, message: "API key is not set." };
  }

  try {
    // Send a minimal test request
    const endpoint = config.endpoint.replace(/\/$/, "");
    const url = `${endpoint}/chat/completions`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: "user", content: "Reply with just 'OK'" }],
        max_tokens: 5,
        temperature: 0,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      return { success: false, message: `Connection failed: ${message}` };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (content && content.toLowerCase().includes("ok")) {
      return { success: true, message: "Connection successful!" };
    }

    return { success: true, message: "Connected (unexpected response format)" };
  } catch (err) {
    if (err instanceof TypeError && err.message.includes("fetch")) {
      return { success: false, message: "Network error: Could not reach the endpoint. Check the URL and your internet connection." };
    }
    return { success: false, message: `Test failed: ${err.message}` };
  }
}

/**
 * Gets a user-friendly error message from an AI error.
 */
export function getAIErrorMessage(err) {
  if (!err) return "Unknown error";

  const message = err.message || String(err);

  // Network errors
  if (message.includes("fetch") || message.includes("network") || message.includes("Failed to fetch")) {
    return "Network error: Could not reach the AI service. Check your internet connection and the endpoint URL in Settings > AI.";
  }

  // Authentication errors
  if (message.includes("401") || message.includes("Unauthorized") || message.includes("invalid api key") || message.includes("authentication")) {
    return "Invalid API key. Please check your key in Settings > AI.";
  }

  // Rate limiting
  if (message.includes("429") || message.includes("rate limit") || message.includes("too many requests")) {
    return "Rate limited. Please wait a moment and try again.";
  }

  // Quota/billing
  if (message.includes("quota") || message.includes("billing") || message.includes("insufficient") || message.includes("credit")) {
    return "API quota exceeded or billing issue. Check your provider account.";
  }

  // Model not found
  if (message.includes("model") && (message.includes("not found") || message.includes("does not exist") || message.includes("404"))) {
    return `Model not found. Check the model name in Settings > AI.`;
  }

  // Endpoint issues
  if (message.includes("404") || message.includes("not found")) {
    return "Endpoint not found. Check the URL in Settings > AI (should end with /v1 or similar).";
  }

  // Timeout
  if (message.includes("timeout") || message.includes("timed out")) {
    return "Request timed out. The AI service took too long to respond.";
  }

  return `AI error: ${message}`;
}

/**
 * Language options for translation and per-note language setting.
 */
export const AI_LANGUAGES = [
  { id: "en", label: "English", native: "English" },
  { id: "ar", label: "Arabic", native: "العربية" },
  { id: "es", label: "Spanish", native: "Español" },
  { id: "fr", label: "French", native: "Français" },
  { id: "de", label: "German", native: "Deutsch" },
  { id: "zh", label: "Chinese (Simplified)", native: "中文" },
  { id: "ja", label: "Japanese", native: "日本語" },
  { id: "ko", label: "Korean", native: "한국어" },
  { id: "pt", label: "Portuguese", native: "Português" },
  { id: "ru", label: "Russian", native: "Русский" },
  { id: "it", label: "Italian", native: "Italiano" },
  { id: "nl", label: "Dutch", native: "Nederlands" },
  { id: "tr", label: "Turkish", native: "Türkçe" },
  { id: "pl", label: "Polish", native: "Polski" },
  { id: "hi", label: "Hindi", native: "हिन्दी" },
];

/**
 * Gets the language label from the code.
 */
export function getLanguageLabel(code) {
  const lang = AI_LANGUAGES.find((l) => l.id === code);
  return lang ? lang.label : code;
}