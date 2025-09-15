// Script to check database tables and diagnose issues

const { createClient } = require('@supabase/supabase-js');

// Load environment variables from .env file
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTable(tableName) {
  try {
    console.log(`Checking table: ${tableName}`);
    
    // Check if table exists
    const { data: tableExists, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', tableName);
    
    if (tableError) {
      console.error(`Error checking if ${tableName} exists:`, tableError);
      return false;
    }
    
    const exists = tableExists && tableExists.length > 0;
    console.log(`Table ${tableName} exists: ${exists}`);
    
    if (exists) {
      // Get table structure
      const { data: columns, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_schema', 'public')
        .eq('table_name', tableName);
      
      if (columnsError) {
        console.error(`Error getting columns for ${tableName}:`, columnsError);
      } else {
        console.log(`Columns for ${tableName}:`);
        columns.forEach(col => {
          console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not nullable'})`);
        });
      }
      
      // Get row count
      const { count, error: countError } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.error(`Error getting row count for ${tableName}:`, countError);
      } else {
        console.log(`Row count for ${tableName}: ${count}`);
      }
    }
    
    return exists;
  } catch (err) {
    console.error(`Error checking table ${tableName}:`, err);
    return false;
  }
}

async function checkTables() {
  const tables = ['users', 'invitation_codes', 'user_quotas', 'packages', 'referrals', 'referral_rewards'];
  
  console.log('Checking database tables...');
  
  for (const table of tables) {
    await checkTable(table);
    console.log('-----------------------------------');
  }
}

// Run table checks
checkTables().then(() => {
  console.log('Table check process completed.');
  process.exit(0);
}).catch(err => {
  console.error('Table check process failed:', err);
  process.exit(1);
});