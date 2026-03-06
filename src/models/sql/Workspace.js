import db from '../../config/db.js';

const Workspace = {

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

  // 👇 Add these two methods
  async create({ name, userId }) {
    // Generate a unique workspace key from the name
    const workspaceKey = name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      + '-' + Date.now();

    const { rows } = await db.query(
      `INSERT INTO workspaces (name, workspace_key)
       VALUES ($1, $2)
       RETURNING *`,
      [name, workspaceKey]
    );

    const workspace = rows[0];

    // Automatically assign creator as ADMIN
    await db.query(
      `INSERT INTO workspace_users (user_id, workspace_id, role)
       VALUES ($1, $2, 'ADMIN')`,
      [userId, workspace.id]
    );

    return { ...workspace, role: 'ADMIN' };
  },

  async findById(id) {
    const { rows } = await db.query(
      'SELECT * FROM workspaces WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  }

};

export default Workspace;