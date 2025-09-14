/**
 * Database Configuration Module
 *
 * This module provides centralized database connection configuration
 * for both Supabase client and direct PostgreSQL connections.
 */

import { createClient } from '@supabase/supabase-js';

// Environment variables (loaded via Vite)
const DATABASE_URL = process.env.DATABASE_URL;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_HOST = process.env.DB_HOST;
const DB_PORT = process.env.DB_PORT;
const DB_NAME = process.env.DB_NAME;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

/**
 * Database connection configuration object
 */
export const dbConfig = {
  // Supabase connection details
  supabase: {
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY,
  },

  // Direct PostgreSQL connection details (Session Pooler)
  postgresql: {
    user: DB_USER,
    password: DB_PASSWORD,
    host: DB_HOST,
    port: parseInt(DB_PORT || '5432'),
    database: DB_NAME,
    connectionString: DATABASE_URL,
  },

  // Connection URLs for different use cases
  urls: {
    // Full connection string for libraries like pg, psycopg2, etc.
    postgresql: DATABASE_URL,

    // Supabase client URL
    supabase: SUPABASE_URL,
  },
};

/**
 * Create and export Supabase client instance
 */
export const supabase = createClient(
  dbConfig.supabase.url!,
  dbConfig.supabase.anonKey!
);

/**
 * Get PostgreSQL connection configuration for direct database access
 */
export const getPostgresConfig = () => ({
  user: dbConfig.postgresql.user,
  password: dbConfig.postgresql.password,
  host: dbConfig.postgresql.host,
  port: dbConfig.postgresql.port,
  database: dbConfig.postgresql.database,
});

/**
 * Get connection string for PostgreSQL libraries
 */
export const getConnectionString = () => dbConfig.urls.postgresql;

/**
 * Validate that all required environment variables are present
 */
export const validateDatabaseConfig = () => {
  const requiredVars = [
    'DATABASE_URL',
    'DB_USER',
    'DB_PASSWORD',
    'DB_HOST',
    'DB_PORT',
    'DB_NAME',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required database environment variables: ${missingVars.join(', ')}`
    );
  }

  return true;
};

/**
 * Test database connection (for development/debugging)
 */
export const testDatabaseConnection = async () => {
  try {
    // Test Supabase connection
    const { data, error } = await supabase
      .from('_supabase_tables') // This is a system table that should exist
      .select('count')
      .limit(1);

    if (error) {
      console.warn('Supabase connection test failed:', error.message);
      return false;
    }

    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
};

// Validate configuration on module load
try {
  validateDatabaseConfig();
  console.log('✅ Database configuration validated');
} catch (error) {
  console.error('❌ Database configuration error:', error);
}
