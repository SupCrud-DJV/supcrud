import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: "smtp-relay.sendinblue.com",
  port: 587,
  auth: {
    user: process.env.EMAIL_FROM,
    pass: process.env.EMAIL_API_KEY,
  },
});

export async function sendOTP(email, code) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Tu OTP para SupCrud",
    text: `Tu código OTP es: ${code}`,
  });
}

export async function sendTicketCreated(email, referenceCode) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Ticket creado en SupCrud",
    text: `Tu ticket ha sido creado. Código: ${referenceCode}`,
  });
}
