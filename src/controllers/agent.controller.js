import crypto from 'crypto';
import User from '../models/sql/User.js';
import WorkspaceInvite from '../models/sql/WorkspaceInvite.js';
import Workspace from '../models/sql/Workspace.js';
import { sendEmail } from '../utils/sendEmail.js';

const INVITE_EXPIRATION_HOURS = 72;

// ── POST /api/agents/invite ──
export const inviteAgent = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const workspace = req.workspace;
    if (!workspace) return res.status(400).json({ message: 'Workspace not found' });

    const normalizedEmail = String(email).trim().toLowerCase();
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + INVITE_EXPIRATION_HOURS * 60 * 60 * 1000);

    const invite = await WorkspaceInvite.create({
      workspaceId: workspace.id,
      email: normalizedEmail,
      token,
      expiresAt,
      role: 'AGENT'
    });

    // Send invitation email (no-op if not configured)
    const acceptUrl = `${process.env.APP_URL || ''}/invite/accept?token=${token}`;
    await sendEmail({
      to: normalizedEmail,
      subject: 'Invitación para ser agente en SupCrud',
      text: `Has sido invitado a unirte como agente al workspace "${workspace.name}". Copia este enlace en tu navegador para aceptar: ${acceptUrl}`
    }).catch(() => {});

    res.status(201).json({ invite: { id: invite.id, email: invite.email, expiresAt: invite.expires_at } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── POST /api/agents/accept ──
export const acceptInvite = async (req, res) => {
  try {
    const { token, name, password } = req.body;
    if (!token) return res.status(400).json({ message: 'Token is required' });

    // Expire old invites before checking
    await WorkspaceInvite.expireOld();

    const invite = await WorkspaceInvite.findByToken(token);
    if (!invite || invite.status !== 'PENDING') {
      return res.status(404).json({ message: 'Invite not found or already used' });
    }

    if (new Date(invite.expires_at) < new Date()) {
      return res.status(410).json({ message: 'Invite has expired' });
    }

    // Ensure workspace still exists and is active
    const workspace = await Workspace.findById(invite.workspace_id);
    if (!workspace || workspace.status !== 'ACTIVE') {
      return res.status(403).json({ message: 'Workspace not available' });
    }

    // Find or create user
    let user = await User.findByEmail(invite.email);
    if (!user) {
      if (!name || !password) {
        return res.status(400).json({ message: 'Name and password are required to create an account' });
      }
      user = await User.create({ name, email: invite.email, password });
    }

    // Associate to workspace (idempotent)
    await User.addToWorkspace(user.id, workspace.id, invite.role);

    await WorkspaceInvite.markAccepted(invite.id, user.id);

    res.json({ message: 'Invite accepted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
