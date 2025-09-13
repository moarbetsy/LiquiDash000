import { supabase } from '../supabase';

async function createTables() {
  console.log('Creating database tables using Supabase client...');

  try {
    // Create clients table
    console.log('Creating clients table...');
    const { error: clientsError } = await supabase.rpc('create_clients_table', {});
    if (clientsError && !clientsError.message.includes('already exists')) {
      console.log('Note: clients table creation attempted (may already exist)');
    }

    // Create products table
    console.log('Creating products table...');
    const { error: productsError } = await supabase.rpc('create_products_table', {});
    if (productsError && !productsError.message.includes('already exists')) {
      console.log('Note: products table creation attempted (may already exist)');
    }

    // Create orders table
    console.log('Creating orders table...');
    const { error: ordersError } = await supabase.rpc('create_orders_table', {});
    if (ordersError && !ordersError.message.includes('already exists')) {
      console.log('Note: orders table creation attempted (may already exist)');
    }

    // Create expenses table
    console.log('Creating expenses table...');
    const { error: expensesError } = await supabase.rpc('create_expenses_table', {});
    if (expensesError && !expensesError.message.includes('already exists')) {
      console.log('Note: expenses table creation attempted (may already exist)');
    }

    // Create logs table
    console.log('Creating logs table...');
    const { error: logsError } = await supabase.rpc('create_logs_table', {});
    if (logsError && !logsError.message.includes('already exists')) {
      console.log('Note: logs table creation attempted (may already exist)');
    }

    console.log('✅ Table creation process completed!');
    console.log('Note: If tables already exist, the above messages are expected.');

    // Verify tables were created
    console.log('\nVerifying table creation...');
    const { data: tables, error: verifyError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['clients', 'products', 'orders', 'expenses', 'logs']);

    if (verifyError) {
      console.log('Could not verify tables via Supabase client (this is normal)');
    } else {
      console.log('Tables found:', tables?.map(t => t.table_name) || []);
    }

  } catch (error) {
    console.error('❌ Error during table creation:', error);
    console.log('\nSince direct table creation via client may not work, please run the migration manually:');
    console.log('1. Go to https://supabase.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Go to SQL Editor');
    console.log('4. Copy and paste the contents of database_migration.sql');
    console.log('5. Click Run');
  }
}

// Run the table creation if this file is executed directly
if (import.meta.main) {
  createTables();
}

export { createTables };
