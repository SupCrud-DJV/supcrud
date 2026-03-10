import openai from "../config/openai.config.js";
import { buildPrompt } from "../utils/aiPrompt.js";

export async function analyzeTicket(ticketData, workspaceConfig) {
  const prompt = buildPrompt(ticketData);
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
  });

  const jsonResponse = JSON.parse(response.choices[0].message.content);
  return jsonResponse;
}
