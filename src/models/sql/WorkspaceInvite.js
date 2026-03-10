import db from '../../config/db.js';

const WorkspaceInvite = {
  async create({ workspaceId, email, token, expiresAt, role = 'AGENT' }) {
    const { rows } = await db.query(
      `INSERT INTO workspace_invites (workspace_id, email, token, expires_at, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [workspaceId, email.toLowerCase(), token, expiresAt, role]
    );
    return rows[0];
  },

  async findByToken(token) {
    const { rows } = await db.query(
      `SELECT * FROM workspace_invites WHERE token = $1`,
      [token]
    );
    return rows[0] || null;
  },

  async markAccepted(id, userId) {
    const { rows } = await db.query(
      `UPDATE workspace_invites
       SET status = 'ACCEPTED', accepted_at = NOW(), accepted_user_id = $2
       WHERE id = $1
       RETURNING *`,
      [id, userId]
    );
    return rows[0];
  },

  async expireOld() {
    await db.query(
      `UPDATE workspace_invites
       SET status = 'EXPIRED'
       WHERE status = 'PENDING' AND expires_at < NOW()`
    );
  }
};

export default WorkspaceInvite;
