// Simulated "AI" responses for the product demo -- no real LLM call. Returns canned text
// after a short delay so the interaction feels real without needing an AI provider account.
export function simulateAiResponse(text: string, delayMs = 900): Promise<string> {
  return new Promise((resolve) => setTimeout(() => resolve(text), delayMs))
}
