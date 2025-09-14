/**
 * Supabase Client Configuration
 *
 * This file exports the configured Supabase client instance.
 * The configuration is managed centrally in databaseConfig.ts
 */

import { supabase } from './lib/databaseConfig'

// Re-export the configured Supabase client
export { supabase }

// Export additional database utilities
export { dbConfig, getPostgresConfig, getConnectionString, validateDatabaseConfig, testDatabaseConnection } from './lib/databaseConfig'
