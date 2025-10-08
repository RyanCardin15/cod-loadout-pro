/**
 * Manual validation script for SchemaMerger
 *
 * This script performs comprehensive validation of the schema-merger
 * implementation by running real merge operations and checking results.
 */

import { SchemaMerger, extractWeaponId, weaponsMatch, mergeAttachments } from '../schema-merger';
import { DataSource } from '../../lineage/lineage-schema';

console.log('🔍 Schema Merger Validation Script\n');
console.log('=' .repeat(80));

let passCount = 0;
let failCount = 0;
const errors: string[] = [];

function assert(condition: boolean, message: string): void {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    failCount++;
    errors.push(message);
  }
}

function testSection(name: string): void {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📋 ${name}`);
  console.log('='.repeat(80));
}

// ============================================================================
// Test 1: Basic Merge with 2 Sources
// ============================================================================

testSection('Test 1: Basic Merge (2 sources, no conflicts)');

try {
  const merger = new SchemaMerger();
  const weaponId = 'test-weapon-001';
  const now = Date.now();

  const sources = [
    {
      source: DataSource.CODARMORY,
      timestamp: now - 3600000,
      data: {
        name: 'MCW',
        game: 'MW3',
        category: 'AR',
        stats: {
          damage: 75,
          range: 70,
          accuracy: 80,
          fireRate: 60,
          mobility: 65,
          control: 75,
          handling: 70,
        },
        meta: {
          tier: 'A',
          popularity: 85,
          pickRate: 15.5,
          winRate: 52.3,
          kd: 1.25,
        },
        ballistics: {
          fireRate: 750,
          magazineSize: 30,
          reloadTime: 2.1,
          ttk: { min: 250, max: 400 },
        },
      },
    },
    {
      source: DataSource.WZSTATS,
      timestamp: now,
      data: {
        name: 'MCW',
        game: 'MW3',
        category: 'AR',
        stats: {
          damage: 75,
          range: 68,
          accuracy: 82,
          fireRate: 62,
          mobility: 67,
          control: 76,
          handling: 71,
        },
        meta: {
          tier: 'A',
          usage: 87,
          pickRate: 16.2,
          winRate: 53.1,
          kd: 1.28,
        },
        ballistics: {
          fireRate: 750,
          magazineSize: 30,
          reloadTime: 2.1,
          ttk: { min: 250, max: 400 },
        },
      },
    },
  ];

  const result = merger.mergeWeapons(weaponId, sources);
  const weapon = result.weapon;

  assert(result !== undefined, 'Result should be defined');
  assert(weapon !== undefined, 'Weapon should be defined');
  assert(weapon.id === weaponId, `Weapon ID should be ${weaponId}`);
  assert(weapon.name === 'MCW', 'Weapon name should be MCW');
  assert(weapon.game === 'MW3', 'Weapon game should be MW3');
  assert(weapon.category === 'AR', 'Weapon category should be AR');

  assert(weapon.stats !== undefined, 'Stats should be defined');
  assert(weapon.stats.damage !== undefined, 'Damage stat should be defined');
  assert(weapon.stats.damage.currentValue === 75, 'Damage value should be 75');
  assert(weapon.stats.damage.sources.length === 2, 'Damage should have 2 sources');

  assert(weapon.stats.damage.confidence !== undefined, 'Confidence should be defined');
  assert(weapon.stats.damage.confidence.value > 0, 'Confidence value should be > 0');
  assert(weapon.stats.damage.confidence.value <= 1, 'Confidence value should be <= 1');

  assert(weapon.lineage !== undefined, 'Lineage should be defined');
  assert(weapon.lineage.totalSources === 2, 'Total sources should be 2');
  assert(weapon.lineage.averageConfidence > 0, 'Average confidence should be > 0');
  assert(weapon.lineage.contributingSources.includes(DataSource.CODARMORY), 'Should include CODARMORY');
  assert(weapon.lineage.contributingSources.includes(DataSource.WZSTATS), 'Should include WZSTATS');

  assert(result.stats.sourcesProcessed === 2, 'Should have processed 2 sources');
  assert(result.errors.length === 0, 'Should have no errors');

  console.log(`\n📊 Merge Stats:`);
  console.log(`   Sources Processed: ${result.stats.sourcesProcessed}`);
  console.log(`   Fields Resolved: ${result.stats.fieldsResolved}`);
  console.log(`   Conflicts: ${result.stats.conflictsDetected}`);
  console.log(`   Confidence: ${(result.stats.averageConfidence * 100).toFixed(1)}%`);
} catch (error) {
  console.error('❌ Test 1 failed with error:', error);
  failCount++;
  errors.push(`Test 1: ${error}`);
}

// ============================================================================
// Test 2: Conflict Resolution (3 sources with different values)
// ============================================================================

testSection('Test 2: Conflict Resolution (3 sources with conflicts)');

try {
  const merger = new SchemaMerger();
  const weaponId = 'test-weapon-002';
  const now = Date.now();

  const sources = [
    {
      source: DataSource.CODARMORY,
      timestamp: now - 86400000,
      data: {
        name: 'Holger 556',
        game: 'MW3',
        category: 'AR',
        stats: {
          damage: 70,
          range: 65,
          accuracy: 75,
          fireRate: 58,
          mobility: 60,
          control: 70,
          handling: 65,
        },
        meta: {
          tier: 'B',
        },
        ballistics: {},
      },
    },
    {
      source: DataSource.WZSTATS,
      timestamp: now - 3600000,
      data: {
        name: 'Holger 556',
        game: 'MW3',
        category: 'AR',
        stats: {
          damage: 75,
          range: 68,
          accuracy: 78,
          fireRate: 60,
          mobility: 62,
          control: 72,
          handling: 67,
        },
        meta: {
          tier: 'A',
        },
        ballistics: {},
      },
    },
    {
      source: DataSource.CODMUNITY,
      timestamp: now,
      data: {
        name: 'Holger 556',
        game: 'MW3',
        category: 'AR',
        stats: {
          damage: 72,
          range: 66,
          accuracy: 76,
          fireRate: 59,
          mobility: 61,
          control: 71,
          handling: 66,
        },
        meta: {
          tier: 'A',
        },
        ballistics: {},
      },
    },
  ];

  const result = merger.mergeWeapons(weaponId, sources);
  const weapon = result.weapon;

  assert(weapon !== undefined, 'Weapon should be defined');
  assert(weapon.lineage.conflictCount > 0, 'Should have detected conflicts');
  assert(weapon.stats.damage.hasConflict === true, 'Damage should be marked as conflicted');

  const damageValue = weapon.stats.damage.currentValue;
  assert(damageValue >= 70 && damageValue <= 75, `Damage should be between 70-75 (got ${damageValue})`);

  assert(weapon.meta.tier.currentValue === 'A', 'Tier should be A (consensus)');
  assert(weapon.meta.tier.sources.length === 3, 'Tier should have 3 sources');
  assert(weapon.lineage.totalSources === 3, 'Total sources should be 3');

  console.log(`\n📊 Conflict Stats:`);
  console.log(`   Conflicts Detected: ${result.stats.conflictsDetected}`);
  console.log(`   Conflicts Resolved: ${result.stats.conflictsResolved}`);
  console.log(`   Damage Value (resolved): ${damageValue}`);
  console.log(`   Tier (consensus): ${weapon.meta.tier.currentValue}`);
} catch (error) {
  console.error('❌ Test 2 failed with error:', error);
  failCount++;
  errors.push(`Test 2: ${error}`);
}

// ============================================================================
// Test 3: Single Source (no conflicts expected)
// ============================================================================

testSection('Test 3: Single Source (no conflicts)');

try {
  const merger = new SchemaMerger();
  const weaponId = 'test-weapon-003';
  const now = Date.now();

  const sources = [
    {
      source: DataSource.CODARMORY,
      timestamp: now,
      data: {
        name: 'SVA 545',
        game: 'MW3',
        category: 'AR',
        stats: {
          damage: 80,
          range: 75,
          accuracy: 85,
          fireRate: 65,
          mobility: 70,
          control: 80,
          handling: 75,
        },
        meta: {
          tier: 'S',
        },
        ballistics: {
          fireRate: 800,
          magazineSize: 35,
        },
      },
    },
  ];

  const result = merger.mergeWeapons(weaponId, sources);
  const weapon = result.weapon;

  assert(weapon !== undefined, 'Weapon should be defined');
  assert(weapon.lineage.conflictCount === 0, 'Should have zero conflicts');
  assert(weapon.stats.damage.hasConflict === false, 'Damage should not be conflicted');
  assert(weapon.stats.damage.currentValue === 80, 'Damage should be 80');
  assert(weapon.lineage.totalSources === 1, 'Total sources should be 1');
  assert(weapon.lineage.contributingSources.includes(DataSource.CODARMORY), 'Should include CODARMORY');

  console.log(`\n📊 Single Source Stats:`);
  console.log(`   Sources: ${weapon.lineage.totalSources}`);
  console.log(`   Conflicts: ${weapon.lineage.conflictCount}`);
  console.log(`   Confidence: ${(weapon.lineage.averageConfidence * 100).toFixed(1)}%`);
} catch (error) {
  console.error('❌ Test 3 failed with error:', error);
  failCount++;
  errors.push(`Test 3: ${error}`);
}

// ============================================================================
// Test 4: Utility Functions
// ============================================================================

testSection('Test 4: Utility Functions');

try {
  // extractWeaponId
  const data1 = { name: 'MCW', game: 'MW3' };
  const data2 = { name: 'MCW', game: 'MW3' };
  const data3 = { name: 'mcw', game: 'mw3' };

  const id1 = extractWeaponId(data1, DataSource.CODARMORY);
  const id2 = extractWeaponId(data2, DataSource.WZSTATS);
  const id3 = extractWeaponId(data3, DataSource.CODMUNITY);

  assert(id1 === id2, 'Same weapon should have same ID');
  assert(id1 === id3, 'Case-insensitive weapon should have same ID');
  assert(/^[a-f0-9]{32}$/.test(id1), 'ID should be 32-char hex string');

  const data4 = { name: 'SVA 545', game: 'MW3' };
  const id4 = extractWeaponId(data4, DataSource.CODARMORY);
  assert(id1 !== id4, 'Different weapons should have different IDs');

  // weaponsMatch
  const weapon1 = { name: 'MCW', game: 'MW3', category: 'AR' };
  const weapon2 = { name: 'MCW', game: 'MW3', category: 'AR' };
  const weapon3 = { name: ' mcw  ', game: 'mw3' };
  const weapon4 = { name: 'SVA 545', game: 'MW3' };
  const weapon5 = { name: 'MCW', game: 'WARZONE' };

  assert(weaponsMatch(weapon1, weapon2) === true, 'Same weapons should match');
  assert(weaponsMatch(weapon1, weapon3) === true, 'Case/whitespace normalized weapons should match');
  assert(weaponsMatch(weapon1, weapon4) === false, 'Different names should not match');
  assert(weaponsMatch(weapon1, weapon5) === false, 'Different games should not match');

  // mergeAttachments
  const attachSources = [
    {
      source: DataSource.CODARMORY,
      attachments: {
        optic: ['RedDot', 'Holo', 'ACOG'],
        barrel: ['Long', 'Short'],
      },
    },
    {
      source: DataSource.WZSTATS,
      attachments: {
        optic: ['RedDot', 'Holo', 'Thermal'],
        barrel: ['Long', 'Suppressor'],
        magazine: ['Extended', 'Drum'],
      },
    },
  ];

  const merged = mergeAttachments(attachSources);
  assert(merged.optic.length === 4, 'Optics should have 4 unique items');
  assert(merged.barrel.length === 3, 'Barrels should have 3 unique items');
  assert(merged.magazine.length === 2, 'Magazines should have 2 unique items');
  assert(JSON.stringify(merged.optic) === JSON.stringify(['ACOG', 'Holo', 'RedDot', 'Thermal']), 'Optics should be sorted');

  console.log(`\n📊 Utility Function Tests:`);
  console.log(`   extractWeaponId: Working correctly`);
  console.log(`   weaponsMatch: Working correctly`);
  console.log(`   mergeAttachments: Working correctly`);
} catch (error) {
  console.error('❌ Test 4 failed with error:', error);
  failCount++;
  errors.push(`Test 4: ${error}`);
}

// ============================================================================
// Test 5: Edge Cases
// ============================================================================

testSection('Test 5: Edge Cases');

try {
  const merger = new SchemaMerger();

  // Empty sources should throw
  let threwError = false;
  try {
    merger.mergeWeapons('test', []);
  } catch (error) {
    threwError = true;
  }
  assert(threwError, 'Should throw error on empty sources');

  // Partial data should use defaults
  const sources = [
    {
      source: DataSource.CODARMORY,
      timestamp: Date.now(),
      data: {
        name: 'MTZ-556',
        game: 'MW3',
        category: 'AR',
        stats: {
          damage: 72,
          range: 70,
        },
        meta: {
          tier: 'B',
        },
        ballistics: {
          fireRate: 700,
        },
      },
    },
  ];

  const result = merger.mergeWeapons('test-partial', sources);
  const weapon = result.weapon;

  assert(weapon.stats.damage !== undefined, 'Damage should exist');
  assert(weapon.stats.range !== undefined, 'Range should exist');
  assert(weapon.stats.accuracy !== undefined, 'Accuracy should exist (default)');
  assert(weapon.stats.fireRate !== undefined, 'FireRate should exist (default)');
  assert(weapon.stats.accuracy.confidence.value === 0, 'Default field should have 0 confidence');
  assert(weapon.stats.damage.confidence.value > 0, 'Provided field should have > 0 confidence');

  console.log(`\n📊 Edge Case Tests:`);
  console.log(`   Empty sources error: Handled correctly`);
  console.log(`   Partial data defaults: Working correctly`);
} catch (error) {
  console.error('❌ Test 5 failed with error:', error);
  failCount++;
  errors.push(`Test 5: ${error}`);
}

// ============================================================================
// Final Summary
// ============================================================================

testSection('FINAL SUMMARY');

const total = passCount + failCount;
const successRate = total > 0 ? (passCount / total * 100).toFixed(1) : '0.0';

console.log(`\n📊 Test Results:`);
console.log(`   Total Tests: ${total}`);
console.log(`   Passed: ${passCount} ✅`);
console.log(`   Failed: ${failCount} ❌`);
console.log(`   Success Rate: ${successRate}%`);

if (failCount > 0) {
  console.log(`\n⚠️  Failed Tests:`);
  errors.forEach((error, index) => {
    console.log(`   ${index + 1}. ${error}`);
  });
  process.exit(1);
} else {
  console.log(`\n🎉 All tests passed!`);
  console.log(`\n✅ Schema Merger is PRODUCTION READY`);
  process.exit(0);
}
