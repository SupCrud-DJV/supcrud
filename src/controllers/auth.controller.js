import jwt from 'jsonwebtoken';
import User from '../models/sql/User.js';
import Workspace from '../models/sql/Workspace.js';

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// ── Register ──
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: 'All fields are required' });

    const existing = await User.findByEmail(email);
    if (existing)
      return res.status(409).json({ message: 'Email already in use' });

    const user  = await User.create({ name, email, password });
    const token = generateToken(user);

    res.status(201).json({ token, user, workspaces: [] });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Login ──
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: 'All fields are required' });

    const user = await User.findByEmail(email);
    if (!user)
      return res.status(401).json({ message: 'Invalid credentials' });

    // 👇 Add this check — user registered with Google, has no password
    if (!user.password)
      return res.status(401).json({ message: 'This account uses Google Sign-In. Please use the Google button instead.' });

    const valid = await User.verifyPassword(password, user.password);
    if (!valid)
      return res.status(401).json({ message: 'Invalid credentials' });

    const workspaces = await Workspace.findByUserId(user.id);
    const token      = generateToken(user);

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar, role: user.role },
      workspaces
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Get current user ──
export const me = async (req, res) => {
  try {
    const user       = await User.findById(req.user.id);
    const workspaces = await Workspace.findByUserId(req.user.id);
    res.json({ user, workspaces });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};