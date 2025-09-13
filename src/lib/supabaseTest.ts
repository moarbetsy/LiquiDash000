import { supabase } from '../supabase';

async function testSupabaseConnection() {
  console.log('Testing Supabase client connection...');

  try {
    // Test basic connection by getting the current session
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error('❌ Supabase connection error:', error);
      return false;
    }

    console.log('✅ Supabase client connection successful!');
    console.log('Session data:', data);

    // Test if we can query the database (this will fail if tables don't exist, but shows connection works)
    try {
      const { data: tables, error: tableError } = await supabase
        .from('clients')
        .select('*')
        .limit(1);

      if (tableError) {
        console.log('⚠️  Tables may not exist yet, but connection is working. Error:', tableError.message);
      } else {
        console.log('✅ Database tables accessible:', tables);
      }
    } catch (queryError) {
      console.log('⚠️  Query failed (expected if tables don\'t exist):', queryError);
    }

    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
    return false;
  }
}

// Run the test if this file is executed directly
if (import.meta.main) {
  testSupabaseConnection();
}

export { testSupabaseConnection };
