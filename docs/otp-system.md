# Sistema OTP

El sistema OTP permite a usuarios consultar el detalle completo de su ticket sin autenticación tradicional.

---

## Flujo de Generación

1. Usuario solicita OTP.
2. Backend genera código de 6 dígitos.
3. Se hashea el código con bcrypt.
4. Se guarda en MongoDB:
   - codeHash
   - expiresAt
   - attempts
   - used = false
5. Se envía correo con el código.

---

## Validación

Al ingresar el OTP:

- Se verifica que no esté expirado.
- Se verifica attempts < máximo permitido.
- Se compara hash.
- Si es válido:
  - used = true
  - Se habilita acceso temporal.
- Si es inválido:
  - attempts++

---

## Reglas

- Expiración: 10 minutos.
- Máximo intentos: 5.
- El OTP se invalida tras uso o expiración.
- Nunca se almacena en texto plano.