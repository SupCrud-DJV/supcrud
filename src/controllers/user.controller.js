import User from '../models/sql/User.js';

// GET /api/users/me
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      user: {
        id:         user.id,
        name:       user.name,
        email:      user.email,
        avatar:     user.avatar,
        role:       user.role,
        created_at: user.created_at,
        has_password: !!user.password  // lets frontend know if they use Google
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/users/me/role?workspaceId=1
export const getMyRole = async (req, res) => {
  try {
    const { workspaceId } = req.query;

    if (!workspaceId)
      return res.status(400).json({ message: 'workspaceId is required' });

    const role = await User.getRoleInWorkspace(req.user.id, workspaceId);

    if (!role)
      return res.status(404).json({ message: 'You are not part of this workspace' });

    res.json({ role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/users/me/password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword)
      return res.status(400).json({ message: 'All fields are required' });

    if (newPassword.length < 6)
      return res.status(400).json({ message: 'New password must be at least 6 characters' });

    const user = await User.findById(req.user.id);

    // Google users have no password
    if (!user.password)
      return res.status(400).json({ message: 'Your account uses Google Sign-In and has no password' });

    const valid = await User.verifyPassword(currentPassword, user.password);
    if (!valid)
      return res.status(401).json({ message: 'Current password is incorrect' });

    await User.updatePassword(req.user.id, newPassword);

    res.json({ message: 'Password updated successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};