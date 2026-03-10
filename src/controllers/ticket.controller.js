import Ticket from "../models/mongo/Tickets.js";
import OTP from "../models/mongo/OTP.js";
import { generateReferenceCode } from "../utils/generateReferenceCode.js";
import { generateOTP, verifyOTP } from "../utils/generateOTP.js";
import { sendOTP, sendTicketCreated } from "../utils/sendEmail.js";
import Workspace from "../models/sql/Workspace.js";

const OTP_TTL_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;

function normalizeString(str) {
  return (str || "").trim();
}

export async function createPublicTicket(req, res) {
  try {
    const { workspaceKey, email, subject, description, type } = req.body;

    if (!workspaceKey || !email || !subject || !description || !type) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const workspace = await Workspace.findByKey(workspaceKey);
    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    if (workspace.status !== "ACTIVE") {
      return res.status(403).json({ message: "Workspace is not active" });
    }

    const normalizedType = type.toUpperCase();
    if (!["P", "Q", "R", "S"].includes(normalizedType)) {
      return res.status(400).json({ message: "Invalid ticket type" });
    }

    const referenceCode = await generateReferenceCode(workspace.workspace_key);

    const ticket = await Ticket.create({
      workspaceKey: workspace.workspace_key,
      referenceCode,
      email: normalizeString(email),
      subject: normalizeString(subject),
      description: normalizeString(description),
      type: normalizedType,
      events: [
        {
          type: "TICKET_CREATED",
          data: {
            workspaceKey: workspace.workspace_key,
            email,
            type: normalizedType,
          },
        },
      ],
    });

    sendTicketCreated(ticket.email, ticket.referenceCode).catch(() => {});

    return res.status(201).json({ referenceCode: ticket.referenceCode });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function getPublicTicket(req, res) {
  try {
    const { referenceCode } = req.params;
    const ticket = await Ticket.findOne({ referenceCode }).lean();
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    return res.json({
      referenceCode: ticket.referenceCode,
      status: ticket.status,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      workspaceKey: ticket.workspaceKey,
      subject: ticket.subject,
      type: ticket.type,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function requestOtp(req, res) {
  try {
    const { referenceCode, email } = req.body;
    if (!referenceCode || !email) {
      return res.status(400).json({ message: "referenceCode and email are required" });
    }

    const ticket = await Ticket.findOne({ referenceCode });
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    if (ticket.email.toLowerCase() !== email.toLowerCase()) {
      return res.status(403).json({ message: "Email does not match" });
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

    return res.json({ message: "OTP sent" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function verifyOtp(req, res) {
  try {
    const { referenceCode, code } = req.body;
    if (!referenceCode || !code) {
      return res.status(400).json({ message: "referenceCode and code are required" });
    }

    const otp = await OTP.findOne({ ticketReferenceCode: referenceCode });
    if (!otp) return res.status(404).json({ message: "OTP not found" });

    if (otp.used) return res.status(400).json({ message: "OTP already used" });

    if (otp.attempts >= OTP_MAX_ATTEMPTS) {
      return res.status(429).json({ message: "Max OTP attempts exceeded" });
    }

    if (otp.expiresAt < new Date()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    const valid = await verifyOTP(code, otp.codeHash);
    if (!valid) {
      otp.attempts += 1;
      await otp.save();
      return res.status(401).json({ message: "Invalid OTP" });
    }

    otp.used = true;
    await otp.save();

    const ticket = await Ticket.findOne({ referenceCode }).lean();
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    return res.json({
      referenceCode: ticket.referenceCode,
      status: ticket.status,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      workspaceKey: ticket.workspaceKey,
      subject: ticket.subject,
      description: ticket.description,
      type: ticket.type,
      priority: ticket.priority,
      assignedAgentId: ticket.assignedAgentId,
      messages: ticket.messages,
      events: ticket.events,
      attachments: ticket.attachments,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function listTickets(req, res) {
  try {
    const { status, type, assignedAgentId, page = 1, pageSize = 20 } = req.query;
    const workspaceKey = req.workspace.workspace_key;

    const filter = { workspaceKey };
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (assignedAgentId) filter.assignedAgentId = assignedAgentId;

    const tickets = await Ticket.find(filter)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(pageSize))
      .limit(Number(pageSize))
      .lean();

    const total = await Ticket.countDocuments(filter);

    return res.json({ tickets, total });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function getTicket(req, res) {
  try {
    const { id } = req.params;
    const workspaceKey = req.workspace.workspace_key;

    const ticket = await Ticket.findOne({ _id: id, workspaceKey }).lean();
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    return res.json({ ticket });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function addMessage(req, res) {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const workspaceKey = req.workspace.workspace_key;

    if (!content) return res.status(400).json({ message: "Content is required" });

    const ticket = await Ticket.findOne({ _id: id, workspaceKey });
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    const message = {
      sender: {
        id: req.user.id,
        name: req.user.email,
        role: req.user.role,
      },
      content,
      createdAt: new Date(),
    };

    ticket.messages.push(message);
    ticket.events.push({ type: "MESSAGE_SENT", data: { userId: req.user.id } });

    await ticket.save();

    return res.json({ message });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function updateStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const workspaceKey = req.workspace.workspace_key;

    if (!status) return res.status(400).json({ message: "Status is required" });

    const ticket = await Ticket.findOne({ _id: id, workspaceKey });
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    ticket.status = status;
    ticket.events.push({ type: "STATUS_CHANGED", data: { status, userId: req.user.id } });
    await ticket.save();

    return res.json({ status: ticket.status });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function assignAgent(req, res) {
  try {
    const { id } = req.params;
    const { agentId } = req.body;
    const workspaceKey = req.workspace.workspace_key;

    if (!agentId) return res.status(400).json({ message: "agentId is required" });

    const ticket = await Ticket.findOne({ _id: id, workspaceKey });
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    ticket.assignedAgentId = agentId;
    ticket.events.push({ type: "AGENT_ASSIGNED", data: { agentId, userId: req.user.id } });
    await ticket.save();

    return res.json({ assignedAgentId: ticket.assignedAgentId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}
