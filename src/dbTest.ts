// Database Connection Test
import { supabase } from './lib/supabase';

export async function testDatabaseConnection() {
  try {
    console.log('🔍 Testing Supabase connection...');
    
    // Test 1: Check if Supabase client is initialized
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }
    console.log('✅ Supabase client initialized');

    // Test 2: Try to query journeys table
    const { data: journeys, error: journeysError } = await supabase
      .from('journeys')
      .select('*')
      .limit(5);

    if (journeysError) {
      console.warn('⚠️ Journeys table query failed:', journeysError.message);
      console.log('This is normal if tables haven\'t been created yet');
    } else {
      console.log('✅ Journeys table accessible');
      console.log(`📊 Found ${journeys?.length || 0} journeys`);
    }

    // Test 3: Check connection by pinging
    const { error: pingError } = await supabase
      .from('journeys')
      .select('count', { count: 'exact', head: true });

    if (pingError) {
      console.warn('⚠️ Database ping failed:', pingError.message);
      return {
        connected: false,
        error: pingError.message,
        needsSetup: true
      };
    }

    console.log('✅ Database connection successful!');
    return {
      connected: true,
      journeyCount: journeys?.length || 0,
      needsSetup: false
    };

  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      needsSetup: true
    };
  }
}
