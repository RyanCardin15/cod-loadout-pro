#!/usr/bin/env tsx

/**
 * Migration System Test
 *
 * Tests the complete migration system end-to-end without writing to database.
 */

import {
  schemaVersionManager,
  migrateV1ToV2,
  migrateV2ToV3,
  canMigrateV1ToV2,
  canMigrateV2ToV3,
  validateV3Migration,
} from './lib/schema';
import { WeaponV1, WeaponV2 } from '../server/src/models/unified-weapon.model';

/**
 * Create a sample V1 weapon for testing
 */
function createSampleV1Weapon(): WeaponV1 {
  return {
    id: 'test-weapon-001',
    name: 'Test Weapon',
    game: 'MW3',
    category: 'AR',
    stats: {
      damage: 80,
      range: 70,
      accuracy: 75,
      fireRate: 85,
      mobility: 65,
      control: 70,
      handling: 75,
    },
    ballistics: {
      damageRanges: [
        { range: 0, damage: 40 },
        { range: 20, damage: 30 },
        { range: 40, damage: 25 },
      ],
      ttk: { min: 0.2, max: 0.4 },
      fireRate: 750,
      magazineSize: 30,
      reloadTime: 2.1,
      adTime: 0.25,
    },
    meta: {
      tier: 'A',
      popularity: 85,
      winRate: 52,
      lastUpdated: new Date().toISOString(),
    },
    attachmentSlots: {
      optic: ['Red Dot', 'Holographic'],
      barrel: ['Long Barrel', 'Short Barrel'],
    },
    bestFor: ['Mid-range combat', 'Versatile gameplay'],
    playstyles: ['Tactical', 'Aggressive'],
    imageUrl: 'https://example.com/weapon.png',
    iconUrl: 'https://example.com/icon.png',
  };
}

/**
 * Run migration tests
 */
async function testMigrationSystem() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 MIGRATION SYSTEM TESTS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  let passed = 0;
  let failed = 0;

  // Test 1: Version Detection
  console.log('Test 1: Version Detection');
  const v1Weapon = createSampleV1Weapon();
  const detectedV1 = schemaVersionManager.detectVersion(v1Weapon);
  if (detectedV1 === 'v1') {
    console.log('  ✅ V1 detection: PASS');
    passed++;
  } else {
    console.log(`  ❌ V1 detection: FAIL (detected ${detectedV1})`);
    failed++;
  }

  // Test 2: V1 → V2 Migration
  console.log('\nTest 2: V1 → V2 Migration');
  const canMigrateV1 = canMigrateV1ToV2(v1Weapon);
  if (!canMigrateV1) {
    console.log('  ❌ V1 migration check: FAIL');
    failed++;
  } else {
    console.log('  ✅ V1 migration check: PASS');
    passed++;

    const v2Weapon = migrateV1ToV2(v1Weapon);
    const detectedV2 = schemaVersionManager.detectVersion(v2Weapon);

    if (detectedV2 === 'v2') {
      console.log('  ✅ V2 migration result: PASS');
      passed++;
    } else {
      console.log(`  ❌ V2 migration result: FAIL (detected ${detectedV2})`);
      failed++;
    }

    // Verify data preservation
    if (v2Weapon.stats.damage === v1Weapon.stats.damage) {
      console.log('  ✅ Data preservation: PASS');
      passed++;
    } else {
      console.log('  ❌ Data preservation: FAIL');
      failed++;
    }

    // Test 3: V2 → V3 Migration
    console.log('\nTest 3: V2 → V3 Migration');
    const canMigrateV2 = canMigrateV2ToV3(v2Weapon);
    if (!canMigrateV2) {
      console.log('  ❌ V2 migration check: FAIL');
      failed++;
    } else {
      console.log('  ✅ V2 migration check: PASS');
      passed++;

      const v3Weapon = migrateV2ToV3(v2Weapon);
      const detectedV3 = schemaVersionManager.detectVersion(v3Weapon);

      if (detectedV3 === 'v3') {
        console.log('  ✅ V3 migration result: PASS');
        passed++;
      } else {
        console.log(`  ❌ V3 migration result: FAIL (detected ${detectedV3})`);
        failed++;
      }

      // Verify MultiSourceField structure
      if (v3Weapon.stats.damage.currentValue === v1Weapon.stats.damage) {
        console.log('  ✅ MultiSourceField data: PASS');
        passed++;
      } else {
        console.log('  ❌ MultiSourceField data: FAIL');
        failed++;
      }

      // Verify lineage
      if (v3Weapon.lineage && v3Weapon.lineage.totalSources === 1) {
        console.log('  ✅ Lineage metadata: PASS');
        passed++;
      } else {
        console.log('  ❌ Lineage metadata: FAIL');
        failed++;
      }

      // Test 4: V3 Validation
      console.log('\nTest 4: V3 Validation');
      const validationErrors = validateV3Migration(v3Weapon);
      if (validationErrors.length === 0) {
        console.log('  ✅ V3 validation: PASS');
        passed++;
      } else {
        console.log(`  ❌ V3 validation: FAIL (${validationErrors.length} errors)`);
        validationErrors.forEach(error => console.log(`    - ${error}`));
        failed++;
      }
    }
  }

  // Test 5: Schema Validation
  console.log('\nTest 5: Schema Validation');
  const v1Validation = schemaVersionManager.validateSchema(v1Weapon, 'v1');
  if (v1Validation.valid) {
    console.log('  ✅ V1 schema validation: PASS');
    passed++;
  } else {
    console.log(`  ❌ V1 schema validation: FAIL`);
    console.log(`    Errors: ${v1Validation.errors.join(', ')}`);
    failed++;
  }

  // Test 6: Migration Path
  console.log('\nTest 6: Migration Path Calculation');
  const path = schemaVersionManager.getMigrationPath('v1', 'v3');
  if (path.length === 3 && path[0] === 'v1' && path[1] === 'v2' && path[2] === 'v3') {
    console.log('  ✅ Migration path: PASS');
    console.log(`    Path: ${path.join(' → ')}`);
    passed++;
  } else {
    console.log(`  ❌ Migration path: FAIL (got ${path.join(' → ')})`);
    failed++;
  }

  // Summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 TEST SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const total = passed + failed;
  const percentage = ((passed / total) * 100).toFixed(1);

  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${percentage}%\n`);

  if (failed === 0) {
    console.log('🎉 All tests passed!\n');
    return 0;
  } else {
    console.log('⚠️  Some tests failed. Review output above.\n');
    return 1;
  }
}

// Run tests
testMigrationSystem()
  .then((exitCode) => process.exit(exitCode))
  .catch((error) => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
