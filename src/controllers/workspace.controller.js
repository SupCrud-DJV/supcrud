import Workspace from '../models/sql/Workspace.js';

export const getMyWorkspaces = async (req, res) => {
  try {
    const workspaces = await Workspace.findByUserId(req.user.id);
    res.json({ workspaces });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createWorkspace = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim().length < 3)
      return res.status(400).json({ message: 'Workspace name must be at least 3 characters' });

    const workspace = await Workspace.create({ name: name.trim(), userId: req.user.id });
    res.status(201).json({ workspace });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getWorkspace = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });
    res.json({ workspace });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateWorkspace = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim().length < 3)
      return res.status(400).json({ message: 'Name must be at least 3 characters' });

    const workspace = await Workspace.updateName(req.params.id, name.trim());
    res.json({ workspace });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMembers = async (req, res) => {
  try {
    const members = await Workspace.getMembers(req.params.id);
    res.json({ members });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAddons = async (req, res) => {
  try {
    const addons = await Workspace.getAddons(req.params.id);
    res.json({ addons });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const toggleAddon = async (req, res) => {
  try {
    const { addonId, activate } = req.body;
    await Workspace.toggleAddon(req.params.id, addonId, activate);
    res.json({ message: activate ? 'Add-on activated' : 'Add-on deactivated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAIConfig = async (req, res) => {
  try {
    const config = await Workspace.getAIConfig(req.params.id);
    res.json({ config: config || {
      mode: 'APPROVAL',
      auto_assign_enabled: false,
      confidence_threshold: 0.80
    }});
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateAIConfig = async (req, res) => {
  try {
    const { mode, auto_assign_enabled, confidence_threshold } = req.body;
    const config = await Workspace.upsertAIConfig(req.params.id, {
      mode, auto_assign_enabled, confidence_threshold
    });
    res.json({ config });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};