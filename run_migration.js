import { readFileSync } from 'fs';
import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const pool = new Pool({
  host: process.env.DATABASE_HOST || 'db.idycycarpdtexqnrxhyg.supabase.co',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  database: process.env.DATABASE_NAME || 'postgres',
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD,
  ssl: {
    rejectUnauthorized: false, // For Supabase, we need to allow self-signed certificates
  },
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
});

async function runMigration() {
  const client = await pool.connect();

  try {
    console.log('Connected to database successfully');

    // Read the migration file
    const migrationSQL = readFileSync('database_migration.sql', 'utf8');

    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        try {
          await client.query(statement);
          console.log(`✓ Statement ${i + 1} executed successfully`);
        } catch (error) {
          console.error(`✗ Error executing statement ${i + 1}:`, error.message);
          // Continue with other statements
        }
      }
    }

    console.log('Migration completed!');

    // Test if tables were created
    console.log('\nTesting table creation...');
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('clients', 'products', 'orders', 'expenses', 'logs')
      ORDER BY table_name
    `);

    console.log('Created tables:', tablesResult.rows.map(row => row.table_name));

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(console.error);
