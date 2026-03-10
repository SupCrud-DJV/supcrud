import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST || "smtp-relay.sendinblue.com";
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER || process.env.EMAIL_FROM;
const SMTP_PASS = process.env.SMTP_PASS || process.env.EMAIL_API_KEY;
const SMTP_SECURE = String(process.env.SMTP_SECURE || "").toLowerCase() === "true" || SMTP_PORT === 465;
const MAIL_FROM = process.env.EMAIL_FROM || SMTP_USER;

const canSendEmail = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);

let transporter = null;
if (canSendEmail) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
} else {
  console.warn(
    "Email sending is disabled. Configure SMTP_USER/SMTP_PASS (or EMAIL_FROM/EMAIL_API_KEY)."
  );
}

export async function sendEmail({ to, subject, text, html }) {
  if (!transporter) {
    console.log("[sendEmail] mailbox: ", to);
    console.log("[sendEmail] subject:", subject);
    console.log("[sendEmail] text:", text);
    return;
  }

  await transporter.sendMail({
    from: MAIL_FROM,
    to,
    subject,
    text,
    html,
  });
}

export async function sendOTP(email, code) {
  await sendEmail({
    to: email,
    subject: "Tu OTP para SupCrud",
    text: `Tu código OTP es: ${code}`,
  });
}

export async function sendTicketCreated(email, referenceCode) {
  await sendEmail({
    to: email,
    subject: "Ticket creado en SupCrud",
    text: `Tu ticket ha sido creado. Código: ${referenceCode}`,
  });
}
