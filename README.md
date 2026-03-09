# SupCrud by Crudzaso

Repositorio de integracion incremental para la plataforma SaaS de gestion de PQRS.

## Stack actual detectado
- Backend: Node.js + Express (ESM) en `server.js`
- Frontend: SPA hash-based servida estaticamente desde `public/app`
- Base relacional: PostgreSQL (`pg`) en `src/config/db.js`
- OAuth: Google (`googleapis`) en `src/controllers/google.controller.js`
- Estado de sesiones: `express-session`
- Integraciones en estado legacy/no cableado: OpenAI, Cloudinary, correo, MongoDB

## Mapa rapido del repo
- `server.js`: entrypoint backend y servidor estatico
- `public/app/*`: frontend principal (landing, login, selector de workspace, dashboard)
- `src/routes/*`: rutas API (auth, google, users, workspaces)
- `src/controllers/*`: controladores para auth, users y workspaces
- `src/models/sql/*`: acceso a PostgreSQL
- `src/views/widget-ui.html`: UI del widget embebible
- `public/widget.js`: script embebible del widget
- `src/config/setup.js`: script para crear/esquematizar tablas SQL

## Estado funcional actual
### Funciona con configuracion completa
- Servidor backend en `http://localhost:3000`
- SPA en `/app`
- Login/Register por email/password (si DB esta configurada)
- OAuth Google (si variables OAuth estan configuradas)
- CRUD basico de workspaces (crear, listar, ver, editar)
- Gestion de miembros/add-ons/config IA por workspace (tabla SQL)

### Parcial o pendiente
- Rutas de tickets/agents/public/addons en `src/routes` estan vacias
- Modelos/controladores Mongo estan vacios
- Swagger no esta implementado en este branch
- Docusaurus no esta presente en este repo
- Tracking publico `/track` queda como scaffold temporal

## Variables de entorno
Usa `.env.example` como plantilla y crea `.env` real.

Variables criticas para arrancar API real:
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `JWT_SECRET`, `SESSION_SECRET`

Variables para integraciones:
- Google OAuth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`
- Cloudinary: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- OpenAI: `OPENAI_API_KEY`
- Email: `EMAIL_FROM`, `EMAIL_API_KEY`
- Mongo (pendiente en branch): `MONGO_URI`

## Ejecucion local
1. Instalar dependencias
```bash
npm install
```

2. Configurar variables
```bash
cp .env.example .env
# editar .env
```

3. (Opcional) Preparar schema SQL
```bash
npm run setup
```
Nota: `npm run setup` actualmente hace `DROP TABLE` de varias tablas antes de recrearlas.

4. Arrancar servidor
```bash
npm run start
```

5. Abrir frontend
- `http://localhost:3000/app`

## Riesgos conocidos de integracion
- El repositorio trae `node_modules` versionado en git, lo que aumenta ruido de merges.
- Hay mezcla de codigo ESM actual y modulos legacy en CommonJS no cableados.
- Existen archivos vacios placeholders que deben completarse por modulo (tickets/OTP/public API).
