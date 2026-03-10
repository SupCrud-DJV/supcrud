import bcrypt from "bcryptjs";

export function generateOTP() {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const hash = bcrypt.hashSync(code, 10);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos
  return { code, hash, expiresAt };
}

export async function verifyOTP(code, hash) {
  return bcrypt.compare(code, hash);
}
