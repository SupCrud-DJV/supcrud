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