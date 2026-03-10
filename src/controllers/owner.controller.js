import Workspace from '../models/sql/Workspace.js';
import Addon from '../models/sql/Addon.js';
import Ticket from '../models/mongo/Tickets.js';

// ── GET /api/owner/workspaces ──
export const listWorkspaces = async (req, res) => {
  try {
    const workspaces = await Workspace.findAll();
    res.json({ workspaces });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── PUT /api/owner/workspaces/:id/status ──
export const updateWorkspaceStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['ACTIVE', 'SUSPENDED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const workspace = await Workspace.updateStatus(req.params.id, status);
    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });

    res.json({ workspace });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── GET /api/owner/workspaces/:id/metrics ──
export const getWorkspaceMetrics = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });

    const metrics = await Ticket.aggregate([
      { $match: { workspace_id: workspace.id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const result = {
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      status: workspace.status,
      tickets: metrics.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      totalTickets: metrics.reduce((acc, item) => acc + item.count, 0)
    };

    res.json({ metrics: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Add-ons catalog (global) ──
export const listAddons = async (req, res) => {
  try {
    const addons = await Addon.findAll();
    res.json({ addons });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createAddon = async (req, res) => {
  try {
    const { code, name, description } = req.body;
    if (!code || !name) return res.status(400).json({ message: 'Code and name are required' });

    const addon = await Addon.create({ code, name, description });
    res.status(201).json({ addon });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateAddon = async (req, res) => {
  try {
    const { code, name, description } = req.body;
    const addon = await Addon.update(req.params.id, { code, name, description });
    if (!addon) return res.status(404).json({ message: 'Add-on not found' });
    res.json({ addon });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteAddon = async (req, res) => {
  try {
    await Addon.delete(req.params.id);
    res.json({ message: 'Add-on deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
