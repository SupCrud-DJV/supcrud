import crypto from 'crypto';
import Ticket from '../models/mongo/Tickets.js';
import OTP from '../models/mongo/OTP.js';
import PublicAccessSession from '../models/mongo/PublicAccessSession.js';
import Workspace from '../models/sql/Workspace.js';
import db from '../config/db.js';
import User from '../models/sql/User.js';
import { uploadFile } from '../services/cloudinary.service.js';
import { generateReferenceCode } from '../utils/generateReferenceCode.js';
import { generateOTP, verifyOTP } from '../utils/generateOTP.js';
import { sendOTP, sendTicketCreated } from '../utils/sendEmail.js';
import { analyzeTicket } from '../services/ai.service.js';
import mongoose from 'mongoose';

const VALID_TICKET_TYPES = ['P', 'Q', 'R', 'S'];
const VALID_STATUS = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REOPENED'];

function ensureMongoConnected(res) {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({ message: 'MongoDB is not connected. Configure MONGO_URI.' });
    return false;
  }
  return true;
}

// ── GET /api/tickets?page=1&limit=10&status=OPEN&type=P ──
export const getTickets = async (req, res) => {
  try {
    if (!ensureMongoConnected(res)) return;
    const { status, type, priority, agentId, from, to, page = 1, limit = 10 } = req.query;
    const workspace = Auth_getWorkspace(req);

    const filter = { workspace_id: workspace.id };
    if (status)   filter.status      = status;
    if (type)     filter.type        = type;
    if (priority) filter.priority    = priority;
    if (agentId)  filter.assigned_to = agentId;

    if (from || to) {
      const createdAtFilter = {};
      if (from) createdAtFilter.$gte = new Date(from);
      if (to)   createdAtFilter.$lte = new Date(to);
      if (Object.keys(createdAtFilter).length) {
        filter.createdAt = createdAtFilter;
      }
    }

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
    if (!ensureMongoConnected(res)) return;
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
    if (!ensureMongoConnected(res)) return;
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

    // If the AI_ASSIST add-on is active and workspace has AI config, analyze the ticket
    const { rows: aiAddonRows } = await db.query(
      `SELECT 1 FROM workspace_addons wa
       JOIN addons a ON wa.addon_id = a.id
       WHERE wa.workspace_id = $1 AND a.code = $2 AND wa.active = true`,
      [workspace.id, 'AI_ASSIST']
    );

    if (aiAddonRows.length > 0) {
      const aiConfig = await Workspace.getAIConfig(workspace.id);
      if (aiConfig) {
        try {
          const analysis = await analyzeTicket({
            subject,
            description,
            type: normalizedType,
            priority: ticket.priority,
          }, aiConfig);

          const eventsToPush = [
            {
              type: 'AI_ANALYZED',
              description: `AI analysis completed (confidence: ${analysis.confidence})`,
              created_by: null
            }
          ];

          const updates = {
            $set: {
              ai_analysis: analysis,
            },
            $push: {
              events: { $each: eventsToPush }
            }
          };

          // Apply priority suggestion (if valid)
          if (analysis.priority && ['LOW', 'MEDIUM', 'HIGH'].includes(analysis.priority.toUpperCase())) {
            updates.$set.priority = analysis.priority.toUpperCase();
          }

          // If AUTO mode and meets confidence threshold, attempt assignment
          const mode = aiConfig.mode?.toUpperCase();
          const threshold = Number(aiConfig.confidence_threshold ?? 0);
          const confidence = Number(analysis.confidence ?? 0);
          if (mode === 'AUTO' && confidence >= threshold && analysis.suggestedAgentCriteria) {
            const candidate = String(analysis.suggestedAgentCriteria).trim();
            let assignId = null;

            if (/^\d+$/.test(candidate)) {
              const user = await User.findById(Number(candidate));
              if (user) assignId = user.id;
            } else {
              const user = await User.findByEmail(candidate);
              if (user) assignId = user.id;
            }

            if (assignId) {
              const role = await User.getRoleInWorkspace(assignId, workspace.id);
              if (role) {
                updates.$set.assigned_to = String(assignId);
                eventsToPush.push({
                  type: 'AI_ASSIGNED',
                  description: `Assigned by AI to agent ${assignId} (confidence ${confidence})`,
                  created_by: null
                });
                updates.$push.events = { $each: eventsToPush };
              }
            }
          }

          await Ticket.findByIdAndUpdate(ticket._id, updates);
        } catch (err) {
          // don't block ticket creation if AI fails
          console.error('AI assist error:', err);
        }
      }
    }

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
    if (!ensureMongoConnected(res)) return;
    const { referenceCode } = req.params;
    const ticket = await Ticket.findOne({ reference_code: referenceCode }).lean();
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    const workspace = await Workspace.findById(ticket.workspace_id);
    if (!workspace || workspace.status !== 'ACTIVE')
      return res.status(403).json({ message: 'Workspace not found or suspended' });

    // Basic public view (no sensitive content)
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

// ── GET /api/public/ticket/:referenceCode/full ──
export const getPublicTicketFull = async (req, res) => {
  try {
    if (!ensureMongoConnected(res)) return;
    const { referenceCode } = req.params;
    const token = req.header('x-public-token') || req.query.token;

    if (!token) return res.status(401).json({ message: 'Access token required' });

    const session = await PublicAccessSession.findOne({ ticketReferenceCode: referenceCode, token });
    if (!session || session.expiresAt < new Date()) {
      return res.status(401).json({ message: 'Invalid or expired access token' });
    }

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

// ── POST /api/tickets/public/request-otp ──
export const requestOtp = async (req, res) => {
  try {
    if (!ensureMongoConnected(res)) return;
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
    if (!ensureMongoConnected(res)) return;
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

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await PublicAccessSession.create({
      ticketReferenceCode: referenceCode,
      token,
      expiresAt,
    });

    const ticket = await Ticket.findOne({ reference_code: referenceCode }).lean();
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    const workspace = await Workspace.findById(ticket.workspace_id);
    if (!workspace || workspace.status !== 'ACTIVE')
      return res.status(403).json({ message: 'Workspace not found or suspended' });

    return res.json({
      accessToken: token,
      expiresAt,
      ticket: {
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
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── PUT /api/tickets/:id/status ──
export const updateStatus = async (req, res) => {
  try {
    if (!ensureMongoConnected(res)) return;
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
    if (!ensureMongoConnected(res)) return;
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
    if (!ensureMongoConnected(res)) return;
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

// ── POST /api/tickets/:id/attachments ──
export const uploadAttachment = async (req, res) => {
  try {
    if (!ensureMongoConnected(res)) return;
    const { fileName, fileBase64 } = req.body;
    if (!fileName || !fileBase64) {
      return res.status(400).json({ message: 'fileName and fileBase64 are required' });
    }

    const { id: workspaceId } = Auth_getWorkspace(req);

    const buffer = Buffer.from(fileBase64, 'base64');
    const cloudinaryResult = await uploadFile(buffer, `attachments/${workspaceId}`);

    const attachment = {
      url: cloudinaryResult.secure_url,
      public_id: cloudinaryResult.public_id,
      original_name: fileName,
      size: cloudinaryResult.bytes,
      uploaded_at: new Date(),
    };

    const ticket = await Ticket.findOneAndUpdate(
      { _id: req.params.id, workspace_id: workspaceId },
      {
        $push: {
          attachments: attachment,
          events: {
            type: 'ATTACHMENT_UPLOADED',
            description: `Attachment uploaded: ${fileName}`,
            created_by: req.user.id
          }
        }
      },
      { new: true }
    );

    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    res.json({ attachment, ticket });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper to get workspace from middleware or headers
function Auth_getWorkspace(req) {
  const workspaceId = req.workspace?.id || req.headers['x-workspace-id'];
  if (!workspaceId) throw new Error('No workspace selected');
  return { id: workspaceId };
}
