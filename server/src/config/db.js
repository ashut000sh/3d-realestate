// The one PostgreSQL connection pool. Services import { query } from here.
import pg from "pg";
import { env } from "./env.js";

let pool;

function getPool() {
  if (!pool) {
    if (!env.DATABASE_URL) throw new Error("DATABASE_URL is not set (see server/.env.example)");
    pool = new pg.Pool({ connectionString: env.DATABASE_URL });
  }
  return pool;
}

export const query = (text, params) => getPool().query(text, params);

// Runs fn(client) inside BEGIN ... COMMIT on one connection; ROLLBACK if it throws.
//   await transaction(async (client) => { await client.query(...); await client.query(...); });
export async function transaction(fn) {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}
