import { Pool } from 'pg';

const pool = new Pool({
  host: import.meta.env.DATABASE_HOST || 'db.idycycarpdtexqnrxhyg.supabase.co',
  port: parseInt(import.meta.env.DATABASE_PORT || '5432'),
  database: import.meta.env.DATABASE_NAME || 'postgres',
  user: import.meta.env.DATABASE_USER || 'postgres',
  password: import.meta.env.DATABASE_PASSWORD,
  ssl: {
    rejectUnauthorized: false, // For Supabase, we need to allow self-signed certificates
  },
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
});

export class DatabaseService {
  private static instance: DatabaseService;

  private constructor() {}

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  async query(text: string, params?: any[]): Promise<any> {
    const client = await pool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getClient(): Promise<any> {
    return await pool.connect();
  }

  async testConnection(): Promise<boolean> {
    try {
      const result = await this.query('SELECT NOW()');
      console.log('Database connection successful:', result.rows[0]);
      return true;
    } catch (error) {
      console.error('Database connection failed:', error);
      return false;
    }
  }

  async close(): Promise<void> {
    await pool.end();
  }
}

export const db = DatabaseService.getInstance();
