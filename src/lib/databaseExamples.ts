/**
 * Database Connection Examples
 *
 * This file contains examples of how to use different database connection methods
 * with your Supabase project. These examples demonstrate:
 * - Supabase JavaScript client usage
 * - Direct PostgreSQL connections
 * - Connection pooling scenarios
 */

import { supabase, getPostgresConfig, getConnectionString } from './databaseConfig';

/**
 * Example 1: Using Supabase JavaScript Client
 * Recommended for most frontend operations
 */
export const supabaseExamples = {
  /**
   * Basic query example
   */
  async fetchUsers() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .limit(10);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching users:', error);
      return null;
    }
  },

  /**
   * Insert data example
   */
  async createUser(userData: { name: string; email: string }) {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([userData])
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating user:', error);
      return null;
    }
  },

  /**
   * Real-time subscription example
   */
  subscribeToUsers(callback: (payload: any) => void) {
    const channel = supabase
      .channel('users-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        callback
      )
      .subscribe();

    return channel;
  },
};

/**
 * Example 2: Direct PostgreSQL Connection (Node.js/server-side)
 * Use this for complex queries, transactions, or when you need more control
 */
export const postgresqlExamples = {
  /**
   * Example using 'pg' library (if installed)
   * Note: This would typically be used in a Node.js environment
   */
  async connectWithPg() {
    // This is an example - you would need to install 'pg' package
    // npm install pg
    /*
    const { Client } = require('pg');

    const client = new Client(getPostgresConfig());

    try {
      await client.connect();
      console.log('Connected to PostgreSQL database');

      const result = await client.query('SELECT NOW()');
      console.log('Current time:', result.rows[0]);

      return result.rows;
    } catch (error) {
      console.error('Database connection error:', error);
      return null;
    } finally {
      await client.end();
    }
    */
  },

  /**
   * Example using connection string
   */
  getConnectionStringExample() {
    const connectionString = getConnectionString();
    console.log('PostgreSQL Connection String:', connectionString);
    return connectionString;
  },
};

/**
 * Example 3: Python Connection Examples
 * For when you need to connect from Python scripts
 */
export const pythonExamples = {
  /**
   * Python connection using psycopg2
   */
  getPsycopg2Example() {
    const config = getPostgresConfig();

    return `
# Python connection example using psycopg2
import psycopg2
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Database connection
try:
    connection = psycopg2.connect(
        user="${config.user}",
        password="${config.password}",
        host="${config.host}",
        port=${config.port},
        dbname="${config.database}"
    )
    print("Connection successful!")

    # Create a cursor to execute SQL queries
    cursor = connection.cursor()

    # Example query
    cursor.execute("SELECT NOW();")
    result = cursor.fetchone()
    print("Current Time:", result)

    # Close the cursor and connection
    cursor.close()
    connection.close()
    print("Connection closed.")

except Exception as e:
    print(f"Failed to connect: {e}")
    `;
  },

  /**
   * Python connection using SQLAlchemy
   */
  getSqlAlchemyExample() {
    const connectionString = getConnectionString();

    return `
# Python connection example using SQLAlchemy
from sqlalchemy import create_engine, text
import os

# Database connection string
DATABASE_URL = "${connectionString}"

# Create engine
engine = create_engine(DATABASE_URL)

# Execute query
with engine.connect() as connection:
    result = connection.execute(text("SELECT NOW()"))
    print("Current Time:", result.fetchone())
    `;
  },
};

/**
 * Example 4: Environment Variables Usage
 * Shows how to access environment variables in your application
 */
export const environmentExamples = {
  /**
   * Access environment variables in your React components
   */
  getEnvironmentInfo() {
    return {
      databaseUrl: process.env.DATABASE_URL,
      supabaseUrl: process.env.SUPABASE_URL,
      dbHost: process.env.DB_HOST,
      dbPort: process.env.DB_PORT,
      // Note: Never log passwords or sensitive keys in production
      hasDatabasePassword: !!process.env.DB_PASSWORD,
    };
  },

  /**
   * Validate all required environment variables are present
   */
  validateEnvironment() {
    const required = [
      'DATABASE_URL',
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      'DB_USER',
      'DB_PASSWORD',
      'DB_HOST',
      'DB_PORT',
      'DB_NAME',
    ];

    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
      console.error('Missing environment variables:', missing);
      return false;
    }

    console.log('✅ All required environment variables are present');
    return true;
  },
};

/**
 * Example 5: Connection Pooling Examples
 * For high-traffic applications
 */
export const poolingExamples = {
  /**
   * Supabase connection pooling info
   */
  getPoolingInfo() {
    return {
      connectionType: 'Session Pooler',
      advantages: [
        'IPv4 compatible',
        'Shared connection pool',
        'Suitable for web applications',
        'Good for stateless operations',
      ],
      useCases: [
        'Web applications',
        'Serverless functions',
        'High-concurrency scenarios',
      ],
    };
  },

  /**
   * Direct connection info (alternative)
   */
  getDirectConnectionInfo() {
    return {
      connectionType: 'Direct Connection',
      advantages: [
        'Dedicated connections',
        'Full PostgreSQL features',
        'Better for long-lived connections',
      ],
      useCases: [
        'Long-running applications',
        'Complex transactions',
        'High-performance requirements',
      ],
      note: 'Requires IPv6 or IPv4 add-on for IPv4 networks',
    };
  },
};

/**
 * Example 6: Migration and Schema Management
 */
export const migrationExamples = {
  /**
   * Example of running migrations with Supabase CLI
   */
  getMigrationCommands() {
    return {
      createMigration: 'supabase migration new create_users_table',
      runMigrations: 'supabase db push',
      generateTypes: 'supabase gen types typescript --local > src/types/database.ts',
      resetDatabase: 'supabase db reset',
    };
  },

  /**
   * Example SQL for creating a users table
   */
  getUserTableSchema() {
    return `
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Create policy for inserting new users
CREATE POLICY "Users can insert their own data" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);
    `;
  },
};

/**
 * Export all examples as a single object
 */
export const databaseConnectionExamples = {
  supabase: supabaseExamples,
  postgresql: postgresqlExamples,
  python: pythonExamples,
  environment: environmentExamples,
  pooling: poolingExamples,
  migrations: migrationExamples,
};
