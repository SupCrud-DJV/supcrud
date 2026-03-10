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
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";

    DROP TABLE IF EXISTS workspace_addons CASCADE;
    DROP TABLE IF EXISTS workspace_users CASCADE;
    DROP TABLE IF EXISTS workspace_ai_config CASCADE;
    DROP TABLE IF EXISTS addons CASCADE;
    DROP TABLE IF EXISTS workspaces CASCADE;
    DROP TABLE IF EXISTS users CASCADE;

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
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name          VARCHAR(100) NOT NULL,
      workspace_key VARCHAR(50)  NOT NULL UNIQUE,
      status        VARCHAR(20)  DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','SUSPENDED')),
      created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS workspace_users (
      user_id      INT NOT NULL,
      workspace_id UUID REFERENCES workspaces(id),
      role         VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN','AGENT')),
      assigned_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, workspace_id),
      FOREIGN KEY (user_id)      REFERENCES users(id)      ON DELETE CASCADE,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS workspace_invites (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
      email VARCHAR(120) NOT NULL,
      token VARCHAR(255) NOT NULL UNIQUE,
      role VARCHAR(20) NOT NULL DEFAULT 'AGENT',
      status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','ACCEPTED','EXPIRED','CANCELLED')),
      expires_at TIMESTAMP NOT NULL,
      accepted_at TIMESTAMP,
      accepted_user_id INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS addons (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      key VARCHAR(50)  NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS workspace_addons (
    workspace_id UUID,
    addon_id UUID,
    active BOOLEAN DEFAULT false,
    config_json JSONB,
    created_at TIMESTAMP DEFAULT NOW(),

    PRIMARY KEY (workspace_id, addon_id),

    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (addon_id) REFERENCES addons(id) ON DELETE CASCADE
);

  CREATE TABLE workspace_ai_config (
    workspace_id UUID PRIMARY KEY REFERENCES workspaces(id),
    mode VARCHAR(20) DEFAULT 'APPROVAL' CHECK (mode IN ('APPROVAL','AUTO')),
    auto_assign_enabled BOOLEAN DEFAULT false,
    confidence_threshold DECIMAL(3,2) DEFAULT 0.80,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);
  `);

const { rows: existingAddons } = await appClient.query('SELECT id FROM addons LIMIT 1');
if (existingAddons.length === 0) {
  await appClient.query(`
    INSERT INTO addons (code, name, description, key) VALUES
    ('ATTACHMENTS', 'Attachments', 'Allow file uploads via Cloudinary', 'attachments'),
    ('AI_ASSIST', 'AI Assist', 'AI-powered ticket classification and routing', 'ai_assist'),
    ('KNOWLEDGE_BASE', 'Knowledge Base', 'Create and publish help articles', 'knowledge_base');
  `);
  console.log('✅ Add-ons seeded');
}

  console.log('✅ Tables ready');
  await appClient.end();
}

setup().catch(err => {
  console.error('❌ Setup failed:', err.message);
  process.exit(1);
});