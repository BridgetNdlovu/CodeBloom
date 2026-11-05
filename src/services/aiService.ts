import type { AIMessage } from "../types";
import { sendAiMessage, type AiChatRequest } from "./apiClient";

/**
 * AI assistant service connected to the ASP.NET Core backend.
 * The backend proxies requests to Google Gemini (when configured) or
 * returns an honest disabled response when the assistant is unavailable.
 */
export async function sendAIMessage(
  input: string,
  missionKey?: string,
  programJson?: string,
): Promise<AIMessage> {
  const request: AiChatRequest = {
    message: input,
    missionKey,
    programJson,
  };
  const response = await sendAiMessage(request);
  if (response.disabled) {
    return {
      id: `ai-${Date.now()}`,
      sender: "assistant",
      text: response.reason ?? "The AI assistant is currently unavailable. Please try again later.",
      at: new Date().toISOString(),
    };
  }
  return {
    id: `ai-${Date.now()}`,
    sender: "assistant",
    text: response.reply,
    at: new Date().toISOString(),
  };
}

export async function getSuggestedPrompts(): Promise<string[]> {
  return [
    "Give me a hint.",
    "Explain sequencing.",
    "What did I do wrong?",
    "Give me a similar challenge.",
  ];
}
