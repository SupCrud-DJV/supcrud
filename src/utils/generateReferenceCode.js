import Ticket from '../models/mongo/Tickets.js';

export async function generateReferenceCode(workspaceKey) {
  const prefix = workspaceKey.slice(0, 6).toUpperCase().replace(/-/g, '');
  let code, exists;

  do {
    const random = Math.random().toString(36).slice(2, 7).toUpperCase();
    code   = `${prefix}-${random}`;
    exists = await Ticket.findOne({ reference_code: code });
  } while (exists);

  return code;
}