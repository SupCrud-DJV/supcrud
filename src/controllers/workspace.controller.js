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

// 👇 Add this
export const createWorkspace = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim().length < 3)
      return res.status(400).json({ message: 'Workspace name must be at least 3 characters' });

    const workspace = await Workspace.create({
      name: name.trim(),
      userId: req.user.id
    });

    res.status(201).json({ workspace });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};