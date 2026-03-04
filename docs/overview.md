# SupCrud by Crudzaso

SupCrud by Crudzaso es una plataforma SaaS multi-tenant para gestión de PQRS (Peticiones, Quejas, Reclamos y Sugerencias).

Permite a negocios integrar un widget embebible en su sitio web para recibir tickets de soporte, gestionarlos internamente y ofrecer consulta pública segura mediante OTP.

---

## Arquitectura General

El sistema está compuesto por:

- Frontend Web
- Backend API REST
- PostgreSQL (Identidad y configuración)
- MongoDB Atlas (Tickets y operaciones dinámicas)
- Cloudinary (Gestión de adjuntos)
- OpenAI API (Clasificación inteligente)
- Sistema de correo (OTP y notificaciones)
- Documentación pública en Docusaurus

---

## Conceptos Clave

- **Workspace:** Representa un negocio independiente.
- **Add-ons:** Funcionalidades activables por workspace.
- **ReferenceCode:** Código único global para cada ticket.
- **OTP:** Validación temporal para consulta completa de ticket.