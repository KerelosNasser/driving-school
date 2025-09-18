// Validation script for advanced theme management features
const { themeEngine } = require('./engine');
const { themeImportExport } = require('./import-export');
const { themeDuplicator } = require('./duplication');

async function validateAdvancedFeatures() {
  console.log('🚀 Validating Advanced Theme Management Features...\n');

  try {
    // Test 1: Custom Theme Creation
    console.log('1. Testing Custom Theme Creation...');
    const customThemeData = {
      name: 'Test Custom Theme',
      description: 'A test theme created programmatically',
      author: 'Theme Validator',
      tags: ['test', 'custom', 'validation']
    };

    const customTheme = await themeEngine.createCustomTheme(customThemeData);
    console.log(`✅ Created custom theme: ${customTheme.name} (ID: ${customTheme.id})`);

    // Test 2: Theme Duplication
    console.log('\n2. Testing Theme Duplication...');
    const duplicateResult = await themeDuplicator.duplicateTheme(customTheme.id, {
      customName: 'Duplicated Test Theme',
      addTags: ['duplicated']
    });

    if (duplicateResult.success) {
      console.log(`✅ Duplicated theme: ${duplicateResult.theme.name} (ID: ${duplicateResult.theme.id})`);
    } else {
      console.log(`❌ Duplication failed: ${duplicateResult.error}`);
    }

    // Test 3: Theme Export
    console.log('\n3. Testing Theme Export...');
    const exportResult = await themeImportExport.exportTheme(customTheme.id);
    
    if (exportResult.success) {
      console.log(`✅ Exported theme data (${exportResult.size} bytes)`);
      
      // Test 4: Theme Import
      console.log('\n4. Testing Theme Import...');
      const importResult = await themeImportExport.importTheme(exportResult.data);
      
      if (importResult.success) {
        console.log(`✅ Imported theme: ${importResult.theme.name} (ID: ${importResult.theme.id})`);
      } else {
        console.log(`❌ Import failed: ${importResult.error}`);
      }
    } else {
      console.log(`❌ Export failed: ${exportResult.error}`);
    }

    // Test 5: Seasonal Variations
    console.log('\n5. Testing Seasonal Variations...');
    const seasonalResult = await themeDuplicator.createSeasonalVariations(customTheme.id);
    
    if (seasonalResult.success) {
      console.log(`✅ Created ${seasonalResult.themes.length} seasonal variations:`);
      seasonalResult.themes.forEach(theme => {
        console.log(`   - ${theme.name} (${theme.metadata.tags.join(', ')})`);
      });
    } else {
      console.log(`❌ Seasonal variations failed: ${seasonalResult.errors?.join(', ')}`);
    }

    // Test 6: Theme Backup
    console.log('\n6. Testing Theme Backup...');
    const backupResult = await themeImportExport.createThemeBackup();
    
    if (backupResult.success) {
      const backupData = JSON.parse(backupResult.data);
      console.log(`✅ Created backup with ${backupData.themes.length} themes (${backupResult.size} bytes)`);
    } else {
      console.log(`❌ Backup failed: ${backupResult.error}`);
    }

    // Test 7: Theme Validation
    console.log('\n7. Testing Theme Validation...');
    const validation = themeEngine.validateTheme(customTheme);
    
    if (validation.isValid) {
      console.log(`✅ Theme validation passed`);
      if (validation.warnings.length > 0) {
        console.log(`⚠️  Warnings: ${validation.warnings.length}`);
      }
    } else {
      console.log(`❌ Theme validation failed: ${validation.errors.length} errors`);
    }

    // Test 8: Metadata Update
    console.log('\n8. Testing Metadata Update...');
    const updatedTheme = await themeEngine.updateThemeMetadata(customTheme.id, {
      description: 'Updated description for validation test',
      tags: ['updated', 'validated', 'test']
    });
    console.log(`✅ Updated theme metadata: ${updatedTheme.metadata.description}`);

    console.log('\n🎉 All advanced theme management features validated successfully!');
    
    // Cleanup
    console.log('\n🧹 Cleaning up test themes...');
    const allThemes = await themeEngine.getAvailableThemesFromStorage();
    const testThemes = allThemes.filter(theme => 
      theme.metadata.tags.includes('test') || 
      theme.metadata.tags.includes('validation') ||
      theme.name.includes('Test')
    );
    
    for (const theme of testThemes) {
      try {
        await themeEngine.deleteTheme(theme.id);
        console.log(`🗑️  Deleted test theme: ${theme.name}`);
      } catch (error) {
        console.log(`⚠️  Could not delete ${theme.name}: ${error.message}`);
      }
    }

    return true;

  } catch (error) {
    console.error('❌ Validation failed:', error);
    return false;
  }
}

// Run validation if called directly
if (require.main === module) {
  validateAdvancedFeatures()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { validateAdvancedFeatures };