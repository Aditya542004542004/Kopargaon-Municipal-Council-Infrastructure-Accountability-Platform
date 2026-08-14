import { readFileSync } from 'fs';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config({ path: new URL('../.env', import.meta.url) });

// Note: table-level GRANTs that make audit_log append-only are set up once via
// the root MySQL user, not by this script (this connection uses the app's
// restricted DB user, which correctly cannot grant/revoke privileges itself —
// that's the whole point). See backend/README.md for the exact GRANT statements.

async function migrate() {
  const connection = await mysql.createConnection({ uri: process.env.DATABASE_URL, multipleStatements: true });
  const schema = readFileSync(new URL('../sql/schema.sql', import.meta.url), 'utf8');
  console.log('Creating tables...');
  await connection.query(schema);
  console.log('Migration complete.');
  await connection.end();
}

migrate().catch((e) => {
  console.error(e);
  process.exit(1);
});
