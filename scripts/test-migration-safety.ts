#!/usr/bin/env tsx

/**
 * Migration System Safety Tests
 *
 * Tests data safety features:
 * - Idempotency (running twice doesn't corrupt data)
 * - Validation prevents bad data
 * - Error handling
 * - Edge cases
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
 * Deep comparison of two objects
 */
function deepEqual(a: any, b: any): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Run safety tests
 */
async function testMigrationSafety() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔒 MIGRATION SYSTEM SAFETY TESTS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  let passed = 0;
  let failed = 0;

  // ============================================================================
  // Test 1: Idempotency - V1 → V2 (running twice should be safe)
  // ============================================================================
  console.log('Test 1: Idempotency - V1 → V2 Migration');
  try {
    const v1Weapon = createSampleV1Weapon();
    const v2First = migrateV1ToV2(v1Weapon);

    // Try to migrate V2 again (should be rejected)
    const canMigrateTwice = canMigrateV1ToV2(v2First);

    if (!canMigrateTwice) {
      console.log('  ✅ V2 weapon correctly rejected from V1→V2 migration');
      passed++;
    } else {
      console.log('  ❌ V2 weapon incorrectly allowed to be migrated again');
      failed++;
    }

    // Verify original data is still intact in V2
    if (v2First.stats.damage === v1Weapon.stats.damage) {
      console.log('  ✅ Original data preserved in V2');
      passed++;
    } else {
      console.log('  ❌ Data corruption detected in V2');
      failed++;
    }
  } catch (error) {
    console.log(`  ❌ Test failed with error: ${error}`);
    failed++;
  }

  // ============================================================================
  // Test 2: Idempotency - V2 → V3 (running twice should be safe)
  // ============================================================================
  console.log('\nTest 2: Idempotency - V2 → V3 Migration');
  try {
    const v1Weapon = createSampleV1Weapon();
    const v2Weapon = migrateV1ToV2(v1Weapon);
    const v3First = migrateV2ToV3(v2Weapon);

    // Try to migrate V3 again (should be rejected)
    const canMigrateTwice = canMigrateV2ToV3(v3First);

    if (!canMigrateTwice) {
      console.log('  ✅ V3 weapon correctly rejected from V2→V3 migration');
      passed++;
    } else {
      console.log('  ❌ V3 weapon incorrectly allowed to be migrated again');
      failed++;
    }

    // Verify data integrity
    if (v3First.stats.damage.currentValue === v1Weapon.stats.damage) {
      console.log('  ✅ Data integrity maintained through full migration chain');
      passed++;
    } else {
      console.log('  ❌ Data corruption in V3');
      failed++;
    }
  } catch (error) {
    console.log(`  ❌ Test failed with error: ${error}`);
    failed++;
  }

  // ============================================================================
  // Test 3: Invalid Input Rejection
  // ============================================================================
  console.log('\nTest 3: Invalid Input Rejection');

  // Test 3a: Missing required fields
  try {
    const invalidWeapon = { id: 'test', name: '' } as any;
    const canMigrate = canMigrateV1ToV2(invalidWeapon);

    if (!canMigrate) {
      console.log('  ✅ Invalid weapon (missing name) correctly rejected');
      passed++;
    } else {
      console.log('  ❌ Invalid weapon incorrectly accepted');
      failed++;
    }
  } catch (error) {
    console.log(`  ❌ Test failed with error: ${error}`);
    failed++;
  }

  // Test 3b: Null/undefined weapon
  try {
    const canMigrateNull = canMigrateV1ToV2(null as any);
    const canMigrateUndefined = canMigrateV1ToV2(undefined as any);

    if (!canMigrateNull && !canMigrateUndefined) {
      console.log('  ✅ Null/undefined weapons correctly rejected');
      passed++;
    } else {
      console.log('  ❌ Null/undefined weapons incorrectly accepted');
      failed++;
    }
  } catch (error) {
    console.log(`  ❌ Test failed with error: ${error}`);
    failed++;
  }

  // ============================================================================
  // Test 4: Data Preservation Through Migration Chain
  // ============================================================================
  console.log('\nTest 4: Data Preservation Through V1 → V2 → V3');
  try {
    const v1Weapon = createSampleV1Weapon();
    const v2Weapon = migrateV1ToV2(v1Weapon);
    const v3Weapon = migrateV2ToV3(v2Weapon);

    let allPreserved = true;
    const issues: string[] = [];

    // Check all critical fields
    if (v3Weapon.id !== v1Weapon.id) {
      allPreserved = false;
      issues.push('ID changed');
    }
    if (v3Weapon.name !== v1Weapon.name) {
      allPreserved = false;
      issues.push('Name changed');
    }
    if (v3Weapon.game !== v1Weapon.game) {
      allPreserved = false;
      issues.push('Game changed');
    }
    if (v3Weapon.category !== v1Weapon.category) {
      allPreserved = false;
      issues.push('Category changed');
    }
    if (v3Weapon.stats.damage.currentValue !== v1Weapon.stats.damage) {
      allPreserved = false;
      issues.push('Damage changed');
    }
    if (v3Weapon.stats.range.currentValue !== v1Weapon.stats.range) {
      allPreserved = false;
      issues.push('Range changed');
    }
    if (v3Weapon.meta.tier.currentValue !== v1Weapon.meta.tier) {
      allPreserved = false;
      issues.push('Tier changed');
    }

    if (allPreserved) {
      console.log('  ✅ All critical data preserved through migration chain');
      passed++;
    } else {
      console.log(`  ❌ Data loss detected: ${issues.join(', ')}`);
      failed++;
    }
  } catch (error) {
    console.log(`  ❌ Test failed with error: ${error}`);
    failed++;
  }

  // ============================================================================
  // Test 5: Edge Case - Empty Stats
  // ============================================================================
  console.log('\nTest 5: Edge Case - Weapon with Zero Stats');
  try {
    const zeroStatsWeapon: WeaponV1 = {
      ...createSampleV1Weapon(),
      stats: {
        damage: 0,
        range: 0,
        accuracy: 0,
        fireRate: 0,
        mobility: 0,
        control: 0,
        handling: 0,
      },
    };

    const v2Weapon = migrateV1ToV2(zeroStatsWeapon);
    const v3Weapon = migrateV2ToV3(v2Weapon);

    // Should migrate successfully but with warnings
    if (v3Weapon.stats.damage.currentValue === 0) {
      console.log('  ✅ Zero stats handled correctly');
      passed++;
    } else {
      console.log('  ❌ Zero stats corrupted during migration');
      failed++;
    }
  } catch (error) {
    console.log(`  ❌ Test failed with error: ${error}`);
    failed++;
  }

  // ============================================================================
  // Test 6: Edge Case - Missing Optional Fields
  // ============================================================================
  console.log('\nTest 6: Edge Case - Missing Optional Fields');
  try {
    const minimalWeapon: WeaponV1 = {
      id: 'minimal-weapon',
      name: 'Minimal Weapon',
      game: 'MW3',
      category: 'AR',
      stats: {
        damage: 50,
        range: 50,
        accuracy: 50,
        fireRate: 50,
        mobility: 50,
        control: 50,
        handling: 50,
      },
      ballistics: {
        damageRanges: [{ range: 0, damage: 30 }],
        ttk: { min: 0.3, max: 0.5 },
        fireRate: 600,
        magazineSize: 30,
        reloadTime: 2.0,
        adTime: 0.3,
      },
      meta: {
        tier: 'B',
        popularity: 50,
        winRate: 50,
        lastUpdated: new Date().toISOString(),
      },
    };

    const v2Weapon = migrateV1ToV2(minimalWeapon);
    const v3Weapon = migrateV2ToV3(v2Weapon);

    const validationErrors = validateV3Migration(v3Weapon);
    if (validationErrors.length === 0) {
      console.log('  ✅ Minimal weapon (no optional fields) migrated successfully');
      passed++;
    } else {
      console.log(`  ❌ Migration failed: ${validationErrors.join(', ')}`);
      failed++;
    }
  } catch (error) {
    console.log(`  ❌ Test failed with error: ${error}`);
    failed++;
  }

  // ============================================================================
  // Test 7: Schema Version Detection Accuracy
  // ============================================================================
  console.log('\nTest 7: Schema Version Detection Accuracy');
  try {
    const v1Weapon = createSampleV1Weapon();
    const v2Weapon = migrateV1ToV2(v1Weapon);
    const v3Weapon = migrateV2ToV3(v2Weapon);

    const detectedV1 = schemaVersionManager.detectVersion(v1Weapon);
    const detectedV2 = schemaVersionManager.detectVersion(v2Weapon);
    const detectedV3 = schemaVersionManager.detectVersion(v3Weapon);

    if (detectedV1 === 'v1' && detectedV2 === 'v2' && detectedV3 === 'v3') {
      console.log('  ✅ All schema versions detected correctly');
      passed++;
    } else {
      console.log(`  ❌ Detection errors: V1=${detectedV1}, V2=${detectedV2}, V3=${detectedV3}`);
      failed++;
    }
  } catch (error) {
    console.log(`  ❌ Test failed with error: ${error}`);
    failed++;
  }

  // ============================================================================
  // Test 8: Backward Migration Prevention
  // ============================================================================
  console.log('\nTest 8: Backward Migration Prevention');
  try {
    let errorCaught = false;
    try {
      schemaVersionManager.getMigrationPath('v3', 'v1');
    } catch (error) {
      if (error instanceof Error && error.message.includes('backwards')) {
        errorCaught = true;
      }
    }

    if (errorCaught) {
      console.log('  ✅ Backward migration correctly prevented');
      passed++;
    } else {
      console.log('  ❌ Backward migration not prevented');
      failed++;
    }
  } catch (error) {
    console.log(`  ❌ Test failed with error: ${error}`);
    failed++;
  }

  // ============================================================================
  // Test 9: V3 Validation Strictness
  // ============================================================================
  console.log('\nTest 9: V3 Validation Strictness');
  try {
    const v1Weapon = createSampleV1Weapon();
    const v2Weapon = migrateV1ToV2(v1Weapon);
    const v3Weapon = migrateV2ToV3(v2Weapon);

    // Intentionally corrupt V3 structure
    const corruptedV3 = { ...v3Weapon };
    delete (corruptedV3 as any).lineage;

    const validationErrors = validateV3Migration(corruptedV3);
    if (validationErrors.length > 0) {
      console.log('  ✅ Validation correctly catches missing lineage');
      passed++;
    } else {
      console.log('  ❌ Validation missed missing lineage');
      failed++;
    }
  } catch (error) {
    console.log(`  ❌ Test failed with error: ${error}`);
    failed++;
  }

  // ============================================================================
  // Test 10: Lineage Metadata Accuracy
  // ============================================================================
  console.log('\nTest 10: Lineage Metadata Accuracy');
  try {
    const v1Weapon = createSampleV1Weapon();
    const v2Weapon = migrateV1ToV2(v1Weapon);
    const v3Weapon = migrateV2ToV3(v2Weapon);

    const lineage = v3Weapon.lineage;

    let accurate = true;
    const issues: string[] = [];

    if (lineage.totalSources !== 1) {
      accurate = false;
      issues.push(`totalSources should be 1, got ${lineage.totalSources}`);
    }
    if (lineage.conflictCount !== 0) {
      accurate = false;
      issues.push(`conflictCount should be 0, got ${lineage.conflictCount}`);
    }
    if (lineage.contributingSources.length !== 1) {
      accurate = false;
      issues.push(`contributingSources should have 1 source, got ${lineage.contributingSources.length}`);
    }
    if (typeof lineage.averageConfidence !== 'number' || lineage.averageConfidence <= 0 || lineage.averageConfidence > 1) {
      accurate = false;
      issues.push(`averageConfidence invalid: ${lineage.averageConfidence}`);
    }

    if (accurate) {
      console.log('  ✅ Lineage metadata is accurate');
      passed++;
    } else {
      console.log(`  ❌ Lineage metadata issues: ${issues.join(', ')}`);
      failed++;
    }
  } catch (error) {
    console.log(`  ❌ Test failed with error: ${error}`);
    failed++;
  }

  // Summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 SAFETY TEST SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const total = passed + failed;
  const percentage = ((passed / total) * 100).toFixed(1);

  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${percentage}%\n`);

  if (failed === 0) {
    console.log('🔒 All safety tests passed! Migration system is safe for production.\n');
    return 0;
  } else {
    console.log('⚠️  Safety issues detected. Review failures before production use.\n');
    return 1;
  }
}

// Run tests
testMigrationSafety()
  .then((exitCode) => process.exit(exitCode))
  .catch((error) => {
    console.error('❌ Safety test execution failed:', error);
    process.exit(1);
  });
