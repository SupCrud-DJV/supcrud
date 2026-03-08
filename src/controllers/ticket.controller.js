import Ticket    from '../models/mongo/Tickets.js';
import Workspace from '../models/sql/Workspace.js';
import { generateReferenceCode } from '../utils/generateReferenceCode.js';

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
    const ticket = await Ticket.findById(req.params.id);
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

    const workspace = await Workspace.findByKey(workspaceKey);
    if (!workspace || workspace.status !== 'ACTIVE')
      return res.status(403).json({ message: 'Workspace not found or suspended' });

    const reference_code = await generateReferenceCode(workspace.workspace_key);

    const ticket = await Ticket.create({
      workspace_id: String(workspace.id),
      reference_code,
      email, subject, description, type,
      events: [{ type: 'CREATED', description: 'Ticket created' }]
    });

    res.status(201).json({ ticket, reference_code });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── PUT /api/tickets/:id/status ──
export const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['OPEN','IN_PROGRESS','RESOLVED','CLOSED'];

    if (!validStatuses.includes(status))
      return res.status(400).json({ message: 'Invalid status' });

    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      {
        status,
        $push: {
          events: {
            type:        'STATUS_CHANGED',
            description: `Status changed to ${status}`,
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

// ── PUT /api/tickets/:id/assign ──
export const assignTicket = async (req, res) => {
  try {
    const { agentId } = req.body;

    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
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

    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
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

// Helper to get workspace from token
function Auth_getWorkspace(req) {
  const workspaceId = req.headers['x-workspace-id'];
  if (!workspaceId) throw new Error('No workspace selected');
  return { id: workspaceId };
}