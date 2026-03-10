import db from '../../config/db.js';

const Addon = {
  async findAll() {
    const { rows } = await db.query(
      'SELECT * FROM addons ORDER BY name ASC'
    );
    return rows;
  },

  async findById(id) {
    const { rows } = await db.query(
      'SELECT * FROM addons WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  },

  async create({ code, name, description }) {
    const { rows } = await db.query(
      `INSERT INTO addons (code, name, description)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [code, name, description]
    );
    return rows[0];
  },

  async update(id, { code, name, description }) {
    const { rows } = await db.query(
      `UPDATE addons SET code = $1, name = $2, description = $3
       WHERE id = $4 RETURNING *`,
      [code, name, description, id]
    );
    return rows[0];
  },

  async delete(id) {
    await db.query('DELETE FROM addons WHERE id = $1', [id]);
  }
};

export default Addon;
