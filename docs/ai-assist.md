# AI Assist

El add-on AI Assist permite clasificación automática de tickets utilizando la API de OpenAI.

---

## Flujo

1. Se envía asunto y descripción a OpenAI.
2. El modelo devuelve JSON estructurado:

```json
{
  "category": "",
  "priority": "",
  "suggestedAgentCriteria": "",
  "confidence": 0.0
}