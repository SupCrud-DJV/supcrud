import { Pool } from 'pg';
import dotenv from "dotenv"

dotenv.config();

const pool = new Pool({
  host:     process.env.DB_HOST || 'localhost',
  user:     process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME || 'postgres',
  port:     process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
});

export default pool;