import pg     from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;

async function setup() {

  // Step 1 — connect to default 'postgres' db to create our db
  const client = new Client({
    host:     process.env.DB_HOST,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'postgres', // connect to default db first
    port:     process.env.DB_PORT || 5432,
  });

  await client.connect();

  // Step 2 — create database if it doesn't exist
  const { rows } = await client.query(
    `SELECT 1 FROM pg_database WHERE datname = $1`,
    [process.env.DB_NAME]
  );

  if (rows.length === 0) {
    await client.query(`CREATE DATABASE ${process.env.DB_NAME}`);
    console.log(`✅ Database "${process.env.DB_NAME}" created`);
  } else {
    console.log(`ℹ️  Database "${process.env.DB_NAME}" already exists`);
  }

  await client.end();

  // Step 3 — connect to our new db and create tables
  const appClient = new Client({
    host:     process.env.DB_HOST,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port:     process.env.DB_PORT || 5432,
  });

  await appClient.connect();

  await appClient.query(`
    CREATE TABLE IF NOT EXISTS users (
      id         SERIAL PRIMARY KEY,
      name       VARCHAR(100)  NOT NULL,
      email      VARCHAR(120)  NOT NULL UNIQUE,
      password   VARCHAR(255),
      avatar     VARCHAR(255),
      google_id  VARCHAR(255),
      role       VARCHAR(20)   DEFAULT 'AGENT' CHECK (role IN ('OWNER','ADMIN','AGENT')),
      created_at TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS workspaces (
      id            SERIAL PRIMARY KEY,
      name          VARCHAR(100) NOT NULL,
      workspace_key VARCHAR(50)  NOT NULL UNIQUE,
      status        VARCHAR(20)  DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','SUSPENDED')),
      created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS workspace_users (
      user_id      INT NOT NULL,
      workspace_id INT NOT NULL,
      role         VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN','AGENT')),
      assigned_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, workspace_id),
      FOREIGN KEY (user_id)      REFERENCES users(id)      ON DELETE CASCADE,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
    );
  `);

  console.log('✅ Tables ready');
  await appClient.end();
}

setup().catch(err => {
  console.error('❌ Setup failed:', err.message);
  process.exit(1);
});