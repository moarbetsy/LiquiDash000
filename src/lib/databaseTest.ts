import { config } from 'dotenv';
import { db } from './database';

// Load environment variables
config({ path: '.env.local' });

async function testDatabaseConnection() {
  console.log('Testing database connection...');

  try {
    const isConnected = await db.testConnection();
    if (isConnected) {
      console.log('✅ Database connection successful!');

      // Test a simple query
      const result = await db.query('SELECT version()');
      console.log('Database version:', result.rows[0].version);

      // Test querying tables (if they exist)
      try {
        const tablesResult = await db.query(`
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = 'public'
          ORDER BY table_name
        `);
        console.log('Available tables:', tablesResult.rows.map(row => row.table_name));
      } catch (error) {
        console.log('Could not query tables (this is normal if no tables exist yet):', error.message);
      }

    } else {
      console.log('❌ Database connection failed');
    }
  } catch (error) {
    console.error('❌ Database connection error:', error);
  } finally {
    // Close the connection pool
    await db.close();
    console.log('Database connection closed');
  }
}

// Run the test if this file is executed directly
if (import.meta.main) {
  testDatabaseConnection();
}

export { testDatabaseConnection };
