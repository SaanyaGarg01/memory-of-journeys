// Automated Database Migration Runner
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Create Supabase client with service role
const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('🚀 Starting database migration...\n');

    // Read the migration SQL file
    const migrationPath = join(__dirname, 'supabase', 'migrations', '20251016083714_create_journey_platform_schema.sql');
    console.log(`📄 Reading migration file: ${migrationPath}`);
    
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    console.log(`✅ Migration file loaded (${migrationSQL.length} characters)\n`);

    // Execute the migration
    console.log('⚙️  Executing migration SQL...');
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      // If rpc doesn't work, try direct execution (this requires service role key)
      console.log('⚠️  RPC method not available, trying alternative approach...\n');
      console.log('⚠️  Note: The anon key cannot run DDL statements directly.');
      console.log('📋 You need to run the migration manually in Supabase Dashboard:');
      console.log('   1. Go to: https://supabase.com/dashboard/project/hgbejfekzsvxsqxmrtgg/sql/new');
      console.log('   2. Copy contents of: supabase/migrations/20251016083714_create_journey_platform_schema.sql');
      console.log('   3. Paste and click "Run"\n');
      throw error;
    }

    console.log('✅ Migration executed successfully!\n');

    // Verify tables were created
    console.log('🔍 Verifying tables...');
    const { data: tables, error: tablesError } = await supabase
      .from('journeys')
      .select('count', { count: 'exact', head: true });

    if (tablesError) {
      console.error('❌ Verification failed:', tablesError.message);
    } else {
      console.log('✅ Tables verified successfully!');
      console.log('📊 Database is ready to use!\n');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error('\n💡 Manual Setup Instructions:');
    console.error('   1. Open Supabase Dashboard: https://supabase.com/dashboard/project/hgbejfekzsvxsqxmrtgg');
    console.error('   2. Go to SQL Editor');
    console.error('   3. Copy and run: supabase/migrations/20251016083714_create_journey_platform_schema.sql\n');
    process.exit(1);
  }
}

runMigration();
