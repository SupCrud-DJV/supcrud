function buildPrompt(ticket) {
    return `Clasifica este ticket en JSON estricto:
{
    "category": "",
    "priority": "",
    "suggestedAgentCriteria": "",
    "confidence": 0.0
}
Ticket:
Asunto: ${ticket.subject}
Descripción: ${ticket.description}`;
}

module.exports = { buildPrompt };