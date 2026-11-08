import crypto from "node:crypto";
import mysql from "mysql2/promise";

const memory = {
  users: new Map(),
  projects: new Map(),
};

let pool;
let schemaReady;

function getPool() {
  if (!process.env.DATABASE_URL) return null;
  if (!pool) {
    pool = mysql.createPool(process.env.DATABASE_URL, {
      connectionLimit: 5,
      waitForConnections: true,
      enableKeepAlive: true
    });
  }
  return pool;
}

export async function ensureSchema() {
  const db = getPool();
  if (!db) return { mode: "memory" };
  if (schemaReady) return schemaReady;
  schemaReady = (async () => {
    await db.query(`CREATE TABLE IF NOT EXISTS siteforge_users (
      id CHAR(36) PRIMARY KEY,
      open_id VARCHAR(191) NOT NULL UNIQUE,
      email VARCHAR(255) NOT NULL DEFAULT '',
      name VARCHAR(255) NOT NULL DEFAULT '',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    await db.query(`CREATE TABLE IF NOT EXISTS siteforge_projects (
      user_id CHAR(36) PRIMARY KEY,
      payload JSON NOT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_siteforge_project_user FOREIGN KEY (user_id) REFERENCES siteforge_users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    return { mode: "mysql" };
  })().catch((error) => {
    schemaReady = undefined;
    throw error;
  });
  return schemaReady;
}

export async function findOrCreateUser(identity) {
  await ensureSchema();
  const db = getPool();
  if (!db) {
    const existing = memory.users.get(identity.openId);
    const user = existing ?? { id: crypto.randomUUID(), openId: identity.openId, email: identity.email ?? "", name: identity.name ?? "" };
    Object.assign(user, { email: identity.email ?? user.email, name: identity.name ?? user.name });
    memory.users.set(identity.openId, user);
    return user;
  }
  const [rows] = await db.query("SELECT * FROM siteforge_users WHERE open_id = ? LIMIT 1", [identity.openId]);
  if (rows[0]) {
    await db.query("UPDATE siteforge_users SET email = ?, name = ? WHERE open_id = ?", [identity.email ?? rows[0].email, identity.name ?? rows[0].name, identity.openId]);
    return mapUser({ ...rows[0], email: identity.email ?? rows[0].email, name: identity.name ?? rows[0].name });
  }
  const id = crypto.randomUUID();
  await db.query("INSERT INTO siteforge_users (id, open_id, email, name) VALUES (?, ?, ?, ?)", [id, identity.openId, identity.email ?? "", identity.name ?? ""]);
  return { id, openId: identity.openId, email: identity.email ?? "", name: identity.name ?? "" };
}

export async function getUserByOpenId(openId) {
  await ensureSchema();
  const db = getPool();
  if (!db) return memory.users.get(openId) ?? null;
  const [rows] = await db.query("SELECT * FROM siteforge_users WHERE open_id = ? LIMIT 1", [openId]);
  return rows[0] ? mapUser(rows[0]) : null;
}

export async function getUserById(id) {
  await ensureSchema();
  const db = getPool();
  if (!db) return [...memory.users.values()].find((user) => user.id === id) ?? null;
  const [rows] = await db.query("SELECT * FROM siteforge_users WHERE id = ? LIMIT 1", [id]);
  return rows[0] ? mapUser(rows[0]) : null;
}

export async function getProject(userId) {
  await ensureSchema();
  const db = getPool();
  if (!db) return memory.projects.get(userId) ?? null;
  const [rows] = await db.query("SELECT payload FROM siteforge_projects WHERE user_id = ? LIMIT 1", [userId]);
  return rows[0]?.payload ? (typeof rows[0].payload === "string" ? JSON.parse(rows[0].payload) : rows[0].payload) : null;
}

export async function saveProject(userId, payload) {
  await ensureSchema();
  const db = getPool();
  if (!db) {
    memory.projects.set(userId, payload);
    return payload;
  }
  await db.query(`INSERT INTO siteforge_projects (user_id, payload) VALUES (?, ?)
    ON DUPLICATE KEY UPDATE payload = VALUES(payload), updated_at = CURRENT_TIMESTAMP`, [userId, JSON.stringify(payload)]);
  return payload;
}

function mapUser(row) {
  return {
    id: row.id,
    openId: row.open_id,
    email: row.email,
    name: row.name,
  };
}
