import { MODEL_PRICING } from "./aiPricing";
import AiUsage from "../backend/models/AiUsage";
import dbConnect from "../backend/db";

export function calculateCost({
  model,
  promptTokens = 0,
  completionTokens = 0,
}) {
  const pricing = MODEL_PRICING[model];

  if (!pricing) {
    throw new Error(`Pricing not defined for model: ${model}`);
  }

  const inputCost = (promptTokens / 1000) * pricing.inputPer1K;
  const outputCost = (completionTokens / 1000) * pricing.outputPer1K;

  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
  };
}

export async function checkDailyLimit(userId, limitUSD = 1) {
  await dbConnect(); // Ensure database connection before querying

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const result = await AiUsage.aggregate([
    { $match: { userId, createdAt: { $gte: today } } },
    { $group: { _id: null, total: { $sum: "$costUSD" } } },
  ]);

  const totalSpent = result[0]?.total ?? 0;

  // if (totalSpent >= limitUSD) {
  //   throw new Error("Daily AI usage limit reached");
  // }

  return totalSpent;
}
