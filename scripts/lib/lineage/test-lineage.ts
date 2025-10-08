/**
 * Simple test file to verify lineage system functionality
 * Run with: npx ts-node scripts/lib/lineage/test-lineage.ts
 */

import {
  lineageTracker,
  DataSource,
  SourceRecord,
  LineageHistoryRecord,
} from './index';

/**
 * Test basic confidence calculation
 */
function testConfidenceCalculation() {
  console.log('\n=== Testing Confidence Calculation ===');

  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  // Test with official API (highest reliability)
  const conf1 = lineageTracker.calculateConfidence(
    DataSource.OFFICIAL_API,
    now,
    1.0
  );
  console.log('Official API (fresh):', conf1.value.toFixed(3));

  // Test with wiki (medium reliability)
  const conf2 = lineageTracker.calculateConfidence(
    DataSource.WIKI,
    oneDayAgo,
    1.0
  );
  console.log('Wiki (1 day old):', conf2.value.toFixed(3));

  // Test with stale data
  const conf3 = lineageTracker.calculateConfidence(
    DataSource.USER_SUBMISSION,
    thirtyDaysAgo,
    1.0
  );
  console.log('User submission (30 days old):', conf3.value.toFixed(3));

  // Test quality factor impact
  const conf4 = lineageTracker.calculateConfidence(
    DataSource.OFFICIAL_API,
    now,
    0.5
  );
  console.log('Official API (low quality):', conf4.value.toFixed(3));
}

/**
 * Test data quality calculation
 */
function testDataQuality() {
  console.log('\n=== Testing Data Quality ===');

  const q1 = lineageTracker.calculateDataQuality(1, 0);
  console.log('1 source, no conflicts:', q1.toFixed(3));

  const q2 = lineageTracker.calculateDataQuality(3, 0);
  console.log('3 sources, no conflicts:', q2.toFixed(3));

  const q3 = lineageTracker.calculateDataQuality(3, 2);
  console.log('3 sources, 2 conflicts:', q3.toFixed(3));

  const q4 = lineageTracker.calculateDataQuality(5, 10);
  console.log('5 sources, many conflicts:', q4.toFixed(3));
}

/**
 * Test stale detection
 */
function testStaleDetection() {
  console.log('\n=== Testing Stale Detection ===');

  const now = Date.now();
  const recent = now - 10 * 24 * 60 * 60 * 1000; // 10 days
  const stale = now - 35 * 24 * 60 * 60 * 1000; // 35 days

  console.log('Recent data (10 days):', lineageTracker.isStale(recent));
  console.log('Stale data (35 days):', lineageTracker.isStale(stale));
}

/**
 * Test conflict detection
 */
function testConflictDetection() {
  console.log('\n=== Testing Conflict Detection ===');

  const now = Date.now();

  // No conflict - same values
  const sources1: SourceRecord[] = [
    {
      source: DataSource.OFFICIAL_API,
      value: 'Sword',
      timestamp: now,
    },
    {
      source: DataSource.WIKI,
      value: 'Sword',
      timestamp: now,
    },
  ];

  const conflict1 = lineageTracker.detectConflict(sources1, 'name');
  console.log('Same values:', conflict1 === null ? 'No conflict' : 'Conflict!');

  // Conflict - different values
  const sources2: SourceRecord[] = [
    {
      source: DataSource.OFFICIAL_API,
      value: 'Sword',
      timestamp: now,
    },
    {
      source: DataSource.WIKI,
      value: 'Blade',
      timestamp: now,
    },
  ];

  const conflict2 = lineageTracker.detectConflict(sources2, 'name');
  console.log(
    'Different values:',
    conflict2 ? `Conflict detected (${conflict2.values.length} values)` : 'No conflict'
  );
}

/**
 * Test multi-source field creation
 */
function testMultiSourceField() {
  console.log('\n=== Testing Multi-Source Field ===');

  const now = Date.now();

  const sources: SourceRecord[] = [
    {
      source: DataSource.OFFICIAL_API,
      value: 100,
      timestamp: now,
    },
    {
      source: DataSource.WIKI,
      value: 95,
      timestamp: now - 1000,
    },
    {
      source: DataSource.USER_SUBMISSION,
      value: 100,
      timestamp: now - 2000,
    },
  ];

  const field = lineageTracker.createMultiSourceField(sources, 'damage');

  console.log('Primary value:', field.currentValue);
  console.log('Primary source:', field.primarySource);
  console.log('Has conflict:', field.hasConflict);
  console.log('Confidence:', field.confidence.value.toFixed(3));
  console.log('Number of sources:', field.sources.length);
}

/**
 * Test history record creation
 */
function testHistoryRecord() {
  console.log('\n=== Testing History Record ===');

  const record = lineageTracker.createHistoryRecord(
    'weapon_001',
    'damage',
    100,
    110,
    DataSource.OFFICIAL_API,
    1.0,
    'Balance update'
  );

  console.log('Weapon ID:', record.weaponId);
  console.log('Field:', record.field);
  console.log('Old value:', record.oldValue);
  console.log('New value:', record.newValue);
  console.log('Source:', record.source);
  console.log('Confidence:', record.confidence.value.toFixed(3));
  console.log('Reason:', record.reason);
}

/**
 * Run all tests
 */
function runAllTests() {
  console.log('Data Lineage System Tests');
  console.log('=========================');

  try {
    testConfidenceCalculation();
    testDataQuality();
    testStaleDetection();
    testConflictDetection();
    testMultiSourceField();
    testHistoryRecord();

    console.log('\n=== All Tests Completed Successfully ===\n');
  } catch (error) {
    console.error('\n=== Test Failed ===');
    console.error(error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}
