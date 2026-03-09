import bcrypt from "bcryptjs";

export function generateOTP() {
  const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 dígitos
  const hash = bcrypt.hashSync(code, 10);
  return { code, hash };
}
