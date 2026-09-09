/**
 * DroneVerse - Supabase Migration Runner
 * Executes supabase/schema.sql directly using postgres connection string
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env from root if present
function loadEnv() {
  try {
    const envPath = path.resolve(__dirname, '../.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let value = match[2] || '';
          if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
          if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
          process.env[key] = value.trim();
        }
      });
    }
  } catch (e) {
    console.warn('Could not read .env file:', e.message);
  }
}

loadEnv();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('ERROR: DATABASE_URL is missing in .env');
  process.exit(1);
}

async function runMigration() {
  console.log('Connecting to Supabase PostgreSQL database...');
  
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL successfully!');

    const sqlPath = path.resolve(__dirname, '../supabase/schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing supabase/schema.sql...');
    await client.query(sql);
    console.log('schema.sql executed successfully!');

    // Verify tables
    const res = await client.query(`
      select table_name 
      from information_schema.tables 
      where table_schema = 'public' and table_name in ('profiles', 'orders', 'wishlist');
    `);

    console.log('Verified created tables:');
    res.rows.forEach(r => console.log(' - ' + r.table_name));

    // Verify trigger on auth.users
    const triggerRes = await client.query(`
      select trigger_name, event_manipulation, event_object_table
      from information_schema.triggers
      where trigger_name = 'on_auth_user_created';
    `);
    console.log('Verified Auth Trigger:', triggerRes.rows);

  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
