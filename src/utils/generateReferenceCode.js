import Ticket from "../models/mongo/Tickets.js";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function randomString(length) {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return result;
}

export async function generateReferenceCode(workspaceKey) {
  const prefix = (workspaceKey || "SUP")
    .toString()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 3);

  for (let i = 0; i < 5; i++) {
    const code = `${prefix}-${randomString(6)}`;
    const exists = await Ticket.findOne({ referenceCode: code }).lean();
    if (!exists) return code;
  }

  throw new Error("No se pudo generar un referenceCode único. Intenta de nuevo.");
}
