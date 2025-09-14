# Database Connection Setup Guide

This guide explains how to use the database connection strings and environment variables that have been configured for your Supabase project.

## 🚀 Quick Start

Your database connections are now configured and ready to use! Here's what you need to know:

### Environment Variables

All database connection details are stored in `.env.local` (automatically ignored by git):

```bash
# Supabase Database Connection (Session Pooler - IPv4 Compatible)
DATABASE_URL=postgresql://postgres.idycycarpdtexqnrxhyg:6RV8nX6OmdV7IrsC@aws-1-us-east-2.pooler.supabase.com:5432/postgres

# Individual connection parameters
DB_USER=postgres.idycycarpdtexqnrxhyg
DB_PASSWORD=6RV8nX6OmdV7IrsC
DB_HOST=aws-1-us-east-2.pooler.supabase.com
DB_PORT=5432
DB_NAME=postgres

# Supabase Project Details
SUPABASE_URL=https://idycycarpdtexqnrxhyg.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 📁 File Structure

```
src/
├── lib/
│   ├── databaseConfig.ts      # Central database configuration
│   ├── databaseExamples.ts    # Usage examples and patterns
│   └── supabase.ts           # Supabase client export
└── .env.local                # Environment variables (gitignored)
```

## 🔧 Usage Examples

### 1. Using Supabase JavaScript Client (Recommended)

```typescript
import { supabase } from '@/lib/databaseConfig';

// Basic query
const { data, error } = await supabase
  .from('users')
  .select('*')
  .limit(10);

// Insert data
const { data, error } = await supabase
  .from('users')
  .insert([{ name: 'John', email: 'john@example.com' }]);
```

### 2. Direct PostgreSQL Connection (Node.js)

```typescript
import { getPostgresConfig, getConnectionString } from '@/lib/databaseConfig';

// Using individual parameters
const config = getPostgresConfig();
// Returns: { user, password, host, port, database }

// Using connection string
const connectionString = getConnectionString();
// Returns: postgresql://user:password@host:port/database
```

### 3. Python Connection

```python
import psycopg2
from dotenv import load_dotenv
import os

load_dotenv()

connection = psycopg2.connect(
    user="postgres.idycycarpdtexqnrxhyg",
    password="6RV8nX6OmdV7IrsC",
    host="aws-1-us-east-2.pooler.supabase.com",
    port=5432,
    dbname="postgres"
)
```

## 🔗 Connection Types

### Session Pooler (Current Setup)
- **Type**: Connection pooling
- **IPv4 Compatible**: ✅ Yes
- **Use Case**: Web applications, serverless functions
- **Advantages**: Shared connection pool, high concurrency

### Direct Connection (Alternative)
- **Type**: Dedicated connections
- **IPv4 Compatible**: ❌ Requires IPv6 or add-on
- **Use Case**: Long-running applications, complex transactions
- **Connection String**: `postgresql://postgres:[PASSWORD]@db.idycycarpdtexqnrxhyg.supabase.co:5432/postgres`

## 🛠️ Available Functions

### From `databaseConfig.ts`:

```typescript
import {
  supabase,                    // Configured Supabase client
  dbConfig,                    // All configuration object
  getPostgresConfig,           // PostgreSQL config object
  getConnectionString,         // Full connection string
  validateDatabaseConfig,      // Validate environment variables
  testDatabaseConnection       // Test connection
} from '@/lib/databaseConfig';
```

### From `databaseExamples.ts`:

```typescript
import { databaseConnectionExamples } from '@/lib/databaseExamples';

// Access examples for different connection methods
const examples = databaseConnectionExamples.supabase;
const pythonCode = databaseConnectionExamples.python.getPsycopg2Example();
```

## 🔒 Security Notes

1. **Never commit `.env.local`** - It's automatically gitignored
2. **Never log passwords** in production code
3. **Use environment-specific variables** for different deployment environments
4. **Rotate passwords regularly** through Supabase dashboard

## 🚀 Deployment

### Environment Variables for Production

When deploying to production platforms (Vercel, Netlify, etc.), set these environment variables:

```bash
DATABASE_URL=postgresql://postgres.idycycarpdtexqnrxhyg:[PASSWORD]@aws-1-us-east-2.pooler.supabase.com:5432/postgres
SUPABASE_URL=https://idycycarpdtexqnrxhyg.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Platform-Specific Setup

**Vercel:**
```bash
vercel env add DATABASE_URL
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
```

**Netlify:**
```bash
netlify env:set DATABASE_URL "your-connection-string"
netlify env:set SUPABASE_URL "your-supabase-url"
```

## 🧪 Testing Your Connection

```typescript
import { testDatabaseConnection } from '@/lib/databaseConfig';

// Test the connection
const isConnected = await testDatabaseConnection();
console.log('Database connected:', isConnected);
```

## 📊 Connection Monitoring

Monitor your database connections through:
- **Supabase Dashboard**: View connection metrics and performance
- **Logs**: Check for connection errors and timeouts
- **Health Checks**: Implement periodic connection tests

## 🔄 Switching Connection Types

To switch from Session Pooler to Direct Connection:

1. Update `.env.local` with direct connection details
2. Update `DATABASE_URL` to use direct connection string
3. Restart your development server
4. Test the new connection

## 🆘 Troubleshooting

### Common Issues:

1. **Connection Timeout**
   - Check if your network allows the connection
   - Verify credentials are correct
   - Try switching between connection types

2. **IPv4/IPv6 Issues**
   - Use Session Pooler for IPv4 networks
   - Enable IPv4 add-on for Direct Connection

3. **Environment Variables Not Loading**
   - Ensure `.env.local` is in the project root
   - Restart your development server
   - Check Vite configuration

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Connection Guide](https://www.postgresql.org/docs/current/libpq-connect.html)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)

## 🎯 Best Practices

1. **Use Supabase Client** for most operations in React apps
2. **Use Direct PostgreSQL** for complex queries or server-side operations
3. **Implement connection pooling** for high-traffic applications
4. **Monitor connection usage** and optimize queries
5. **Use environment variables** for all sensitive configuration
6. **Validate configuration** on application startup

---

Your database connections are now properly configured and ready for use! 🎉
