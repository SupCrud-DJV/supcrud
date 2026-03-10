import nodemailer from "nodemailer";

const canSendEmail = Boolean(process.env.EMAIL_FROM && process.env.EMAIL_API_KEY);

let transporter = null;
if (canSendEmail) {
  transporter = nodemailer.createTransport({
    host: "smtp-relay.sendinblue.com",
    port: 587,
    auth: {
      user: process.env.EMAIL_FROM,
      pass: process.env.EMAIL_API_KEY,
    },
  });
} else {
  console.warn(
    "⚠️  EMAIL_FROM / EMAIL_API_KEY not set. Email sending is disabled."
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
    from: process.env.EMAIL_FROM,
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
