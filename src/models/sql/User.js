import db  from '../../config/db.js';
import bcrypt from 'bcryptjs';

const User = {

  async findByEmail(email) {
    const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    return rows[0] || null;
  },

  async findById(id) {
    const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    return rows[0] || null;
  },

  async create({ name, email, password, avatar = null, google_id = null }) {
    const hashed = password ? await bcrypt.hash(password, 10) : null;
    const { rows } = await db.query(
      `INSERT INTO users (name, email, password, avatar, google_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, avatar`,
      [name, email, hashed, avatar, google_id]
    );
    return rows[0];
  },

  async verifyPassword(plain, hashed) {
    return bcrypt.compare(plain, hashed);
  }

};

export default User;