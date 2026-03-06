import db  from '../../config/db.js';

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
  }

};

export default Workspace;