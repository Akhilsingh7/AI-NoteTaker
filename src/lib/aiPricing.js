export const MODEL_PRICING = {
  "text-embedding-3-small": {
    provider: "openai",
    inputPer1K: 0.00002,
    outputPer1K: 0,
  },
  "gemini-flash-latest": {
    provider: "gemini",
    inputPer1K: 0.00035, // approx
    outputPer1K: 0.00105, // approx
  },
  "gemini-2.5-flash-lite": {
    provider: "gemini",
    inputPer1K: 0.00035, // approx
    outputPer1K: 0.00105, // approx
  },
  "gpt-4o-mini": {
    provider: "openai",
    inputPer1K: 0.00015, // $0.15 per 1M tokens
    outputPer1K: 0.0006, // $0.60 per 1M tokens
  },
};
