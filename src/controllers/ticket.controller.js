import Ticket from '../models/mongo/Tickets.js';
import OTP from '../models/mongo/OTP.js';
import Workspace from '../models/sql/Workspace.js';
import { generateReferenceCode } from '../utils/generateReferenceCode.js';
import { generateOTP, verifyOTP } from '../utils/generateOTP.js';
import { sendOTP, sendTicketCreated } from '../utils/sendEmail.js';

const VALID_TICKET_TYPES = ['P', 'Q', 'R', 'S'];
const VALID_STATUS = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

// ── GET /api/tickets?page=1&limit=10&status=OPEN&type=P ──
export const getTickets = async (req, res) => {
  try {
    const { status, type, priority, page = 1, limit = 10 } = req.query;
    const workspace = Auth_getWorkspace(req);

    const filter = { workspace_id: workspace.id };
    if (status)   filter.status   = status;
    if (type)     filter.type     = type;
    if (priority) filter.priority = priority;

    const skip  = (page - 1) * limit;
    const total = await Ticket.countDocuments(filter);
    const tickets = await Ticket.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .select('-messages -events'); // exclude heavy fields from list

    res.json({
      tickets,
      pagination: {
        total,
        page:       Number(page),
        limit:      Number(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── GET /api/tickets/:id ──
export const getTicket = async (req, res) => {
  try {
    const { id: workspaceId } = Auth_getWorkspace(req);
    const ticket = await Ticket.findOne({ _id: req.params.id, workspace_id: workspaceId });
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    res.json({ ticket });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── POST /api/tickets/public ── (from widget, no auth)
export const createPublicTicket = async (req, res) => {
  try {
    const { workspaceKey, email, subject, description, type } = req.body;

    if (!workspaceKey || !email || !subject || !description || !type)
      return res.status(400).json({ message: 'All fields are required' });

    const normalizedType = (type || '').toUpperCase();
    if (!VALID_TICKET_TYPES.includes(normalizedType)) {
      return res.status(400).json({ message: 'Invalid ticket type' });
    }

    const workspace = await Workspace.findByKey(workspaceKey);
    if (!workspace || workspace.status !== 'ACTIVE')
      return res.status(403).json({ message: 'Workspace not found or suspended' });

    const referenceCode = await generateReferenceCode(workspace.workspace_key);

    const ticket = await Ticket.create({
      workspace_id: String(workspace.id),
      reference_code: referenceCode,
      email,
      subject,
      description,
      type: normalizedType,
      events: [{ type: 'CREATED', description: 'Ticket created' }],
    });

    // Send optional notification email (no-op if not configured)
    sendTicketCreated(email, referenceCode).catch(() => {});

    return res.status(201).json({ referenceCode });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── GET /api/tickets/public/:referenceCode ──
export const getPublicTicket = async (req, res) => {
  try {
    const { referenceCode } = req.params;
    const ticket = await Ticket.findOne({ reference_code: referenceCode }).lean();
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    const workspace = await Workspace.findById(ticket.workspace_id);
    if (!workspace || workspace.status !== 'ACTIVE')
      return res.status(403).json({ message: 'Workspace not found or suspended' });

    return res.json({
      referenceCode: ticket.reference_code,
      status: ticket.status,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      workspaceId: ticket.workspace_id,
      subject: ticket.subject,
      type: ticket.type,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── POST /api/tickets/public/request-otp ──
export const requestOtp = async (req, res) => {
  try {
    const { referenceCode, email } = req.body;
    if (!referenceCode || !email)
      return res.status(400).json({ message: 'referenceCode and email are required' });

    const ticket = await Ticket.findOne({ reference_code: referenceCode });
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    const workspace = await Workspace.findById(ticket.workspace_id);
    if (!workspace || workspace.status !== 'ACTIVE')
      return res.status(403).json({ message: 'Workspace not found or suspended' });

    if (ticket.email.toLowerCase() !== email.toLowerCase()) {
      return res.status(403).json({ message: 'Email does not match' });
    }

    const { code, hash, expiresAt } = generateOTP();

    await OTP.findOneAndUpdate(
      { ticketReferenceCode: referenceCode },
      {
        ticketReferenceCode: referenceCode,
        email: ticket.email,
        codeHash: hash,
        expiresAt,
        attempts: 0,
        used: false,
      },
      { upsert: true, new: true }
    );

    await sendOTP(ticket.email, code).catch(() => {});

    return res.json({ message: 'OTP sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── POST /api/tickets/public/verify-otp ──
export const verifyOtp = async (req, res) => {
  try {
    const { referenceCode, code } = req.body;
    if (!referenceCode || !code)
      return res.status(400).json({ message: 'referenceCode and code are required' });

    const otp = await OTP.findOne({ ticketReferenceCode: referenceCode });
    if (!otp) return res.status(404).json({ message: 'OTP not found' });

    if (otp.used) return res.status(400).json({ message: 'OTP already used' });

    if (otp.attempts >= 5) {
      return res.status(429).json({ message: 'Max OTP attempts exceeded' });
    }

    if (otp.expiresAt < new Date()) {
      return res.status(400).json({ message: 'OTP expired' });
    }

    const valid = await verifyOTP(code, otp.codeHash);
    if (!valid) {
      otp.attempts += 1;
      await otp.save();
      return res.status(401).json({ message: 'Invalid OTP' });
    }

    otp.used = true;
    await otp.save();

    const ticket = await Ticket.findOne({ reference_code: referenceCode }).lean();
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    const workspace = await Workspace.findById(ticket.workspace_id);
    if (!workspace || workspace.status !== 'ACTIVE')
      return res.status(403).json({ message: 'Workspace not found or suspended' });

    return res.json({
      referenceCode: ticket.reference_code,
      status: ticket.status,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      workspaceId: ticket.workspace_id,
      subject: ticket.subject,
      description: ticket.description,
      type: ticket.type,
      priority: ticket.priority,
      assignedAgentId: ticket.assigned_to,
      messages: ticket.messages,
      events: ticket.events,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── PUT /api/tickets/:id/status ──
export const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!VALID_STATUS.includes(status))
      return res.status(400).json({ message: 'Invalid status' });

    const { id: workspaceId } = Auth_getWorkspace(req);

    const ticket = await Ticket.findOneAndUpdate(
      { _id: req.params.id, workspace_id: workspaceId },
      {
        status,
        $push: {
          events: {
            type: 'STATUS_CHANGED',
            description: `Status changed to ${status}`,
            created_by: req.user.id,
          },
        },
      },
      { new: true }
    );

    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    res.json({ ticket });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── PUT /api/tickets/:id/assign ──
export const assignTicket = async (req, res) => {
  try {
    const { agentId } = req.body;
    const { id: workspaceId } = Auth_getWorkspace(req);

    const ticket = await Ticket.findOneAndUpdate(
      { _id: req.params.id, workspace_id: workspaceId },
      {
        assigned_to: agentId,
        $push: {
          events: {
            type:        'ASSIGNED',
            description: `Ticket assigned to agent ${agentId}`,
            created_by:  req.user.id
          }
        }
      },
      { new: true }
    );

    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    res.json({ ticket });

  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── POST /api/tickets/:id/messages ──
export const addMessage = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: 'Content is required' });

    const { id: workspaceId } = Auth_getWorkspace(req);

    const ticket = await Ticket.findOneAndUpdate(
      { _id: req.params.id, workspace_id: workspaceId },
      {
        $push: {
          messages: { content, created_by: req.user.id },
          events:   { type: 'MESSAGE_ADDED', description: 'New reply added', created_by: req.user.id }
        }
      },
      { new: true }
    );

    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    res.json({ ticket });

  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper to get workspace from middleware or headers
function Auth_getWorkspace(req) {
  const workspaceId = req.workspace?.id || req.headers['x-workspace-id'];
  if (!workspaceId) throw new Error('No workspace selected');
  return { id: workspaceId };
}