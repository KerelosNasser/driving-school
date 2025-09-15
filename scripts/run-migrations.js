// Script to run database migrations

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration(filePath) {
  try {
    console.log(`Running migration: ${path.basename(filePath)}`);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error(`Error running migration ${path.basename(filePath)}:`, error);
      return false;
    }
    
    console.log(`Successfully ran migration: ${path.basename(filePath)}`);
    return true;
  } catch (err) {
    console.error(`Error processing migration ${path.basename(filePath)}:`, err);
    return false;
  }
}

async function runMigrations() {
  const migrationsDir = path.join(__dirname, '..', 'sql', 'migrations');
  
  try {
    // Check if migrations directory exists
    if (!fs.existsSync(migrationsDir)) {
      console.log('Migrations directory not found. Creating it...');
      fs.mkdirSync(migrationsDir, { recursive: true });
      console.log('Migrations directory created.');
      return;
    }
    
    // Get all SQL files in the migrations directory
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sort to ensure migrations run in order
    
    if (files.length === 0) {
      console.log('No migration files found.');
      return;
    }
    
    console.log(`Found ${files.length} migration files.`);
    
    // Run each migration
    let successCount = 0;
    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const success = await runMigration(filePath);
      if (success) successCount++;
    }
    
    console.log(`Completed ${successCount}/${files.length} migrations.`);
  } catch (err) {
    console.error('Error running migrations:', err);
  }
}

// Run migrations
runMigrations().then(() => {
  console.log('Migration process completed.');
  process.exit(0);
}).catch(err => {
  console.error('Migration process failed:', err);
  process.exit(1);
});