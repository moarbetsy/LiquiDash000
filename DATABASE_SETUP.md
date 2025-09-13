# Database Connection Setup

This project now supports direct PostgreSQL connections to your Supabase database for development and testing purposes.

## Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# Supabase Database Connection
DATABASE_HOST=db.idycycarpdtexqnrxhyg.supabase.co
DATABASE_PORT=5432
DATABASE_NAME=postgres
DATABASE_USER=postgres
DATABASE_PASSWORD=Admin000
```

## Getting Your Database Password

To get your Supabase database password:

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to Settings → Database
4. Copy the password from the "Connection parameters" section

**Important:** Never commit your database password to version control. The `.env.local` file is already in `.gitignore`.

## Testing the Connection

To test your database connection, run:

```bash
npm run test:db
```

This will:
- Test the connection to your Supabase database
- Show the database version
- List available tables (if any exist)

## Usage in Code

Import and use the database service:

```typescript
import { db } from './lib/database';

// Simple query
const result = await db.query('SELECT * FROM your_table');

// Parameterized query (recommended)
const result = await db.query('SELECT * FROM users WHERE id = $1', [userId]);

// Get a client for transactions
const client = await db.getClient();
try {
  await client.query('BEGIN');
  // ... your transaction logic
  await client.query('COMMIT');
} finally {
  client.release();
}
```

## Security Notes

- The connection uses SSL with `rejectUnauthorized: false` for Supabase compatibility
- Connection pooling is configured with a maximum of 20 clients
- Idle connections are closed after 30 seconds
- Connection timeout is set to 2 seconds

## Current Architecture

Your application currently uses two database access methods:

1. **Supabase Client** (`src/supabase.ts`, `src/lib/supabaseService.ts`) - For application data access
2. **Direct PostgreSQL** (`src/lib/database.ts`) - For direct database operations, testing, and development

Choose the appropriate method based on your use case:
- Use Supabase Client for application features (CRUD operations, real-time subscriptions)
- Use Direct PostgreSQL for database administration, migrations, or custom queries
