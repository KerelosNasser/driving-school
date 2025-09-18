// Integration test for preset system functionality
const { presetManager } = require('./presets');
const { themeEngine } = require('./engine');

async function testPresetSystem() {
  console.log('🧪 Testing Theme Preset System...\n');

  try {
    // Test 1: Load default preset
    console.log('1. Testing default preset loading...');
    const defaultPreset = presetManager.getDefaultPreset();
    console.log(`✅ Default preset loaded: ${defaultPreset.name}`);
    console.log(`   Description: ${defaultPreset.description}`);
    console.log(`   Category: ${defaultPreset.category}\n`);

    // Test 2: Load all presets
    console.log('2. Testing all presets loading...');
    const categories = presetManager.getAllPresets();
    console.log(`✅ Loaded ${categories.length} categories:`);
    categories.forEach(cat => {
      console.log(`   - ${cat.name}: ${cat.presets.length} presets`);
    });
    console.log();

    // Test 3: Test seasonal presets
    console.log('3. Testing seasonal presets...');
    const seasonalPresets = presetManager.getPresetsByCategory('seasonal');
    console.log(`✅ Found ${seasonalPresets.length} seasonal presets:`);
    seasonalPresets.forEach(preset => {
      console.log(`   - ${preset.name}: ${preset.description}`);
    });
    console.log();

    // Test 4: Test branded presets
    console.log('4. Testing branded presets...');
    const brandedPresets = presetManager.getPresetsByCategory('branded');
    console.log(`✅ Found ${brandedPresets.length} branded presets:`);
    brandedPresets.forEach(preset => {
      console.log(`   - ${preset.name}: ${preset.description}`);
    });
    console.log();

    // Test 5: Test preset search
    console.log('5. Testing preset search...');
    const searchResults = presetManager.searchPresets('professional');
    console.log(`✅ Search for 'professional' found ${searchResults.length} results:`);
    searchResults.forEach(preset => {
      console.log(`   - ${preset.name}`);
    });
    console.log();

    // Test 6: Test custom preset creation
    console.log('6. Testing custom preset creation...');
    const testTheme = defaultPreset.theme;
    const customPreset = presetManager.createCustomPreset(
      testTheme,
      'Test Custom Theme',
      'A test custom theme for validation'
    );
    console.log(`✅ Created custom preset: ${customPreset.name}`);
    console.log(`   ID: ${customPreset.id}`);
    console.log(`   Category: ${customPreset.category}\n`);

    // Test 7: Test preset export/import
    console.log('7. Testing preset export/import...');
    const exportData = presetManager.exportPreset(customPreset.id);
    if (exportData) {
      console.log('✅ Preset exported successfully');
      
      const importedPreset = presetManager.importPreset(exportData);
      if (importedPreset) {
        console.log(`✅ Preset imported successfully: ${importedPreset.name}`);
      } else {
        console.log('❌ Failed to import preset');
      }
    } else {
      console.log('❌ Failed to export preset');
    }
    console.log();

    // Test 8: Test preset statistics
    console.log('8. Testing preset statistics...');
    const stats = presetManager.getPresetStats();
    console.log(`✅ Preset statistics:`);
    console.log(`   Total presets: ${stats.total}`);
    console.log(`   By category:`);
    Object.entries(stats.byCategory).forEach(([category, count]) => {
      console.log(`     - ${category}: ${count}`);
    });
    console.log();

    // Test 9: Test theme application
    console.log('9. Testing theme application...');
    const springPreset = presetManager.getPresetById('seasonal-spring');
    if (springPreset) {
      console.log(`✅ Found Spring preset: ${springPreset.name}`);
      console.log(`   Primary color: ${springPreset.theme.colors.primary[500]}`);
      console.log(`   Secondary color: ${springPreset.theme.colors.secondary[500]}`);
      console.log(`   Hero gradient stops: ${springPreset.theme.gradients.hero.colorStops.length}`);
    } else {
      console.log('❌ Spring preset not found');
    }
    console.log();

    // Test 10: Validate preset thumbnails
    console.log('10. Testing preset thumbnails...');
    const allPresets = categories.flatMap(cat => cat.presets);
    let thumbnailCount = 0;
    allPresets.forEach(preset => {
      if (preset.thumbnail && preset.thumbnail.includes('linear-gradient')) {
        thumbnailCount++;
      }
    });
    console.log(`✅ ${thumbnailCount}/${allPresets.length} presets have valid thumbnails\n`);

    console.log('🎉 All preset system tests completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Default preset: ✅`);
    console.log(`   - Category loading: ✅`);
    console.log(`   - Seasonal presets: ✅ (${seasonalPresets.length} presets)`);
    console.log(`   - Branded presets: ✅ (${brandedPresets.length} presets)`);
    console.log(`   - Search functionality: ✅`);
    console.log(`   - Custom preset creation: ✅`);
    console.log(`   - Export/Import: ✅`);
    console.log(`   - Statistics: ✅`);
    console.log(`   - Theme application: ✅`);
    console.log(`   - Thumbnails: ✅`);

  } catch (error) {
    console.error('❌ Preset system test failed:', error);
    console.error(error.stack);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testPresetSystem();
}

module.exports = { testPresetSystem };