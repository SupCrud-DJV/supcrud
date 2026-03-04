# Variables de Entorno (.env)

El backend requiere un archivo `.env` en la raíz del proyecto.

Ejemplo:

```env
# Server
PORT=3000

# PostgreSQL
DB_HOST=
DB_PORT=
DB_USER=
DB_PASSWORD=
DB_NAME=supcrud

# MongoDB
MONGO_URI=

# JWT
JWT_SECRET=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# OpenAI
OPENAI_API_KEY=

# Email (Brevo / SMTP)
EMAIL_FROM=
EMAIL_API_KEY=
EMAIL_HOST=
EMAIL_PORT=587

# OTP
OTP_EXPIRES_MINUTES=10
OTP_MAX_ATTEMPTS=5