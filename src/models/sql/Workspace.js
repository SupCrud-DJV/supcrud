import db from '../../config/db.js';

const Workspace = {

  async findAll() {
    const { rows } = await db.query(
      'SELECT * FROM workspaces ORDER BY created_at DESC'
    );
    return rows;
  },

  async findByUserId(userId) {
    const { rows } = await db.query(`
      SELECT w.*, wu.role
      FROM workspaces w
      JOIN workspace_users wu ON wu.workspace_id = w.id
      WHERE wu.user_id = $1
    `, [userId]);
    return rows;
  },

  async findByKey(workspaceKey) {
    const { rows } = await db.query(
      'SELECT * FROM workspaces WHERE workspace_key = $1',
      [workspaceKey]
    );
    return rows[0] || null;
  },

  async findById(id) {
    const { rows } = await db.query(
      'SELECT * FROM workspaces WHERE id = $1', [id]
    );
    return rows[0] || null;
  },

  async create({ name, userId }) {
    const workspaceKey = name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      + '-' + Date.now();

    const { rows } = await db.query(
      `INSERT INTO workspaces (name, workspace_key)
       VALUES ($1, $2) RETURNING *`,
      [name, workspaceKey]
    );
    const workspace = rows[0];
    await db.query(
      `INSERT INTO workspace_users (user_id, workspace_id, role)
       VALUES ($1, $2, 'ADMIN')`,
      [userId, workspace.id]
    );
    return { ...workspace, role: 'ADMIN' };
  },

  async updateName(id, name) {
    const { rows } = await db.query(
      `UPDATE workspaces SET name = $1 WHERE id = $2 RETURNING *`,
      [name, id]
    );
    return rows[0];
  },

  async updateStatus(id, status) {
    const { rows } = await db.query(
      `UPDATE workspaces SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id]
    );
    return rows[0];
  },

  async getMembers(workspaceId) {
    const { rows } = await db.query(`
      SELECT u.id, u.name, u.email, u.avatar, wu.role, wu.assigned_at
      FROM users u
      JOIN workspace_users wu ON wu.user_id = u.id
      WHERE wu.workspace_id = $1
      ORDER BY wu.assigned_at ASC
    `, [workspaceId]);
    return rows;
  },

  async getAddons(workspaceId) {
    const { rows } = await db.query(`
      SELECT a.*, 
        CASE WHEN wa.workspace_id IS NOT NULL THEN true ELSE false END AS active
      FROM addons a
      LEFT JOIN workspace_addons wa 
        ON wa.addon_id = a.id AND wa.workspace_id = $1
      ORDER BY a.name ASC
    `, [workspaceId]);
    return rows;
  },

  async toggleAddon(workspaceId, addonId, activate) {
    if (activate) {
      await db.query(
        `INSERT INTO workspace_addons (workspace_id, addon_id)
         VALUES ($1, $2)
         ON CONFLICT (workspace_id, addon_id) DO UPDATE SET active = true`,
        [workspaceId, addonId]
      );
    } else {
      await db.query(
        `DELETE FROM workspace_addons
         WHERE workspace_id = $1 AND addon_id = $2`,
        [workspaceId, addonId]
      );
    }
  },

  async getAIConfig(workspaceId) {
    const { rows } = await db.query(
      `SELECT * FROM workspace_ai_config WHERE workspace_id = $1`,
      [workspaceId]
    );
    return rows[0] || null;
  },

  async upsertAIConfig(workspaceId, { mode, auto_assign_enabled, confidence_threshold }) {
    const { rows } = await db.query(`
      INSERT INTO workspace_ai_config (workspace_id, mode, auto_assign_enabled, confidence_threshold)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (workspace_id) DO UPDATE SET
        mode                  = EXCLUDED.mode,
        auto_assign_enabled   = EXCLUDED.auto_assign_enabled,
        confidence_threshold  = EXCLUDED.confidence_threshold
      RETURNING *
    `, [workspaceId, mode, auto_assign_enabled, confidence_threshold]);
    return rows[0];
  }

};

export default Workspace;
