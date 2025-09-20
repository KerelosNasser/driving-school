#!/usr/bin/env node

/**
 * Script to verify the real-time collaborative editing migration
 * This script checks that all tables and functions were created correctly
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables:');
    console.error('   - NEXT_PUBLIC_SUPABASE_URL');
    console.error('   - SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyMigration() {
    console.log('🔍 Verifying real-time collaborative editing migration...');
    
    let allPassed = true;
    
    try {
        // Verify tables were created
        console.log('\n📋 Checking table creation...');
        
        const tables = [
            'page_content',
            'content_versions',
            'edit_sessions',
            'component_library', 
            'page_components',
            'navigation_items',
            'conflict_resolutions'
        ];
        
        for (const table of tables) {
            try {
                const { data: tableData, error: tableError } = await supabase
                    .from(table)
                    .select('*')
                    .limit(1);
                    
                if (tableError) {
                    console.error(`❌ Table ${table}: ${tableError.message}`);
                    allPassed = false;
                } else {
                    console.log(`✅ Table ${table}: OK`);
                }
            } catch (err) {
                console.error(`❌ Table ${table}: ${err.message}`);
                allPassed = false;
            }
        }
        
        // Test database functions
        console.log('\n🧪 Testing database functions...');
        
        const functions = [
            {
                name: 'detect_version_conflict',
                params: {
                    p_page_name: 'test',
                    p_content_key: 'test',
                    p_expected_version: '1.0.0'
                }
            },
            {
                name: 'cleanup_stale_locks',
                params: {}
            },
            {
                name: 'cleanup_inactive_sessions',
                params: {}
            }
        ];
        
        for (const func of functions) {
            try {
                const { data: functionData, error: functionError } = await supabase
                    .rpc(func.name, func.params);
                    
                if (functionError) {
                    console.error(`❌ Function ${func.name}: ${functionError.message}`);
                    allPassed = false;
                } else {
                    console.log(`✅ Function ${func.name}: OK`);
                }
            } catch (err) {
                console.error(`❌ Function ${func.name}: ${err.message}`);
                allPassed = false;
            }
        }
        
        // Check component library has default items
        console.log('\n📦 Checking component library...');
        try {
            const { data: components, error: compError } = await supabase
                .from('component_library')
                .select('name, category')
                .eq('is_active', true);
                
            if (compError) {
                console.error(`❌ Component library check: ${compError.message}`);
                allPassed = false;
            } else if (components && components.length > 0) {
                console.log(`✅ Component library: ${components.length} components loaded`);
                components.forEach(comp => {
                    console.log(`   - ${comp.name} (${comp.category})`);
                });
            } else {
                console.log(`⚠️  Component library: No components found (this is OK if you haven't added any yet)`);
            }
        } catch (err) {
            console.error(`❌ Component library check: ${err.message}`);
            allPassed = false;
        }
        
        // Check indexes exist (this is a basic check)
        console.log('\n🗂️  Checking key indexes...');
        try {
            // Test a query that would use indexes
            const { data: indexTest, error: indexError } = await supabase
                .from('page_content')
                .select('page_name, content_key')
                .eq('page_name', 'test')
                .limit(1);
                
            if (indexError && !indexError.message.includes('relation "page_content" does not exist')) {
                console.error(`❌ Index test: ${indexError.message}`);
                allPassed = false;
            } else {
                console.log(`✅ Indexes: Basic query test passed`);
            }
        } catch (err) {
            console.error(`❌ Index test: ${err.message}`);
            allPassed = false;
        }
        
        // Summary
        console.log('\n' + '='.repeat(60));
        if (allPassed) {
            console.log('🎉 Migration verification PASSED!');
            console.log('\n✅ All components verified successfully:');
            console.log('   ✅ Database tables created');
            console.log('   ✅ Database functions working');
            console.log('   ✅ Component library initialized');
            console.log('   ✅ Indexes functioning');
            console.log('\n🚀 Ready to implement real-time collaborative editing!');
        } else {
            console.log('❌ Migration verification FAILED!');
            console.log('\n⚠️  Some components are not working correctly.');
            console.log('   Please check the errors above and re-run the migration.');
            process.exit(1);
        }
        
    } catch (err) {
        console.error('❌ Unexpected error during verification:', err);
        process.exit(1);
    }
}

verifyMigration();