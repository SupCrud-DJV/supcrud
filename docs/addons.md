
---

# 📄 4️⃣ `addons.md`

```md
# Gestión de Add-ons

Cada workspace puede activar o desactivar funcionalidades específicas.

---

## Activación de Add-on

1. El Owner Global define el catálogo en la tabla `addons`.
2. El workspace activa un add-on creando un registro en `workspace_addons`.
3. El backend valida el add-on mediante middleware antes de ejecutar la funcionalidad.

---

## Validación en Backend

Antes de ejecutar una función protegida:

- Se obtiene el workspace desde el JWT.
- Se consulta `workspace_addons`.
- Si active = false → se retorna 403.

---

## Add-ons Disponibles

### ATTACHMENTS
Permite subir archivos a Cloudinary.

### AI_ASSIST
Permite clasificación inteligente y auto-asignación.

### KNOWLEDGE_BASE
Permite gestión de artículos públicos.