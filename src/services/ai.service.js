const openai = require("../config/openai.config");
const { buildPrompt } = require("../utils/aiPrompt");

async function analyzeTicket(ticketData, workspaceConfig) {
    const prompt = buildPrompt(ticketData);
    const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
    });

    const jsonResponse = JSON.parse(response.choices[0].message.content);
    return jsonResponse;
}

module.exports = { analyzeTicket };