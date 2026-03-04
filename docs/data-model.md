
---

# 📄 3️⃣ `data-model.md` (Estructura de Base de Datos)

```md
# Modelo de Datos

SupCrud utiliza dos bases de datos:

- PostgreSQL → Identidad, Workspaces, Add-ons
- MongoDB → Tickets y operaciones dinámicas

---

## PostgreSQL

### Tabla: workspaces

| Campo | Tipo |
|-------|------|
| id | UUID |
| workspace_key | VARCHAR |
| name | VARCHAR |
| status | VARCHAR (ACTIVE / SUSPENDED) |
| created_at | TIMESTAMP |

---

### Tabla: addons

| Campo | Tipo |
|-------|------|
| id | UUID |
| code | VARCHAR |
| name | VARCHAR |
| description | TEXT |
| created_at | TIMESTAMP |

Ejemplos de code:
- ATTACHMENTS
- AI_ASSIST
- KNOWLEDGE_BASE

---

### Tabla: workspace_addons

| Campo | Tipo |
|-------|------|
| id | UUID |
| workspace_id | UUID |
| addon_id | UUID |
| active | BOOLEAN |
| config_json | JSONB |
| created_at | TIMESTAMP |

config_json permite guardar configuraciones dinámicas como:

```json
{
  "mode": "AUTO",
  "autoAssignEnabled": true,
  "confidenceThreshold": 0.85
}

{
  "workspaceId": "UUID",
  "referenceCode": "SC-WSX92-8H3K91",
  "type": "P|Q|R|S",
  "subject": "",
  "description": "",
  "status": "OPEN",
  "attachments": [],
  "events": [],
  "otp": {
    "codeHash": "",
    "expiresAt": "",
    "attempts": 0,
    "used": false
  },
  "createdAt": "",
  "updatedAt": ""
}
```