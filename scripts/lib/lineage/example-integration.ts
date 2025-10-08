/**
 * Example Integration: Using Lineage System in Weapon Data Pipeline
 *
 * This file demonstrates how to integrate the lineage tracking system
 * into the weapon data collection and management pipeline.
 */

import {
  lineageTracker,
  // lineageQueryService, // Unused in examples to avoid Firestore writes
  DataSource,
  SourceRecord,
  // MultiSourceField, // Unused - imported for reference only
} from './index';

/**
 * Example: Tracking weapon data from multiple sources
 */
async function trackWeaponData() {
  console.log('=== Weapon Data Lineage Tracking Example ===\n');

  // Scenario: We have collected damage data from multiple sources
  const weaponId = 'ak47_cold_war';
  const field = 'damage';

  // Source 1: CODArmory (most reliable)
  const codArmoryData: SourceRecord = {
    source: DataSource.CODARMORY,
    value: 35,
    timestamp: Date.now(),
    reference: 'https://codarmory.com/weapons/ak47',
    notes: 'Official stats from CODArmory API',
  };

  // Source 2: WZStats (analytical source)
  const wzStatsData: SourceRecord = {
    source: DataSource.WZSTATS,
    value: 34,
    timestamp: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
    reference: 'https://wzstats.gg/weapons/ak47',
    notes: 'Community-verified stats',
  };

  // Source 3: User submission
  const userSubmission: SourceRecord = {
    source: DataSource.USER_SUBMISSION,
    value: 35,
    timestamp: Date.now() - 24 * 60 * 60 * 1000, // 1 day ago
    reference: 'user_12345',
    notes: 'User testing data',
  };

  // Create multi-source field
  const sources = [codArmoryData, wzStatsData, userSubmission];
  const damageField = lineageTracker.createMultiSourceField(sources, field);

  console.log('Multi-Source Field Analysis:');
  console.log('----------------------------');
  console.log('Primary Value:', damageField.currentValue);
  console.log('Primary Source:', damageField.primarySource);
  console.log('Has Conflict:', damageField.hasConflict);
  console.log('Confidence Score:', damageField.confidence.value.toFixed(3));
  console.log('Source Reliability:', damageField.confidence.sourceReliability);
  console.log('Freshness:', damageField.confidence.freshness.toFixed(3));
  console.log('Quality Factor:', damageField.confidence.quality.toFixed(3));
  console.log('Number of Sources:', damageField.sources.length);

  if (damageField.hasConflict) {
    console.log('\nConflict Details:');
    damageField.conflictDetails?.forEach((conflict) => {
      console.log(`  Field: ${conflict.field}`);
      conflict.values.forEach((v) => {
        console.log(`    - ${v.source}: ${v.value}`);
      });
    });
  }

  // Create and store history record
  const historyRecord = lineageTracker.createHistoryRecord(
    weaponId,
    field,
    null, // No previous value (first entry)
    damageField.currentValue,
    damageField.primarySource,
    damageField.confidence.quality,
    'Initial data collection from multiple sources',
    damageField.sources.find((s) => s.source === damageField.primarySource)
      ?.reference
  );

  console.log('\nHistory Record Created:');
  console.log('----------------------');
  console.log('Weapon ID:', historyRecord.weaponId);
  console.log('Field:', historyRecord.field);
  console.log('New Value:', historyRecord.newValue);
  console.log('Source:', historyRecord.source);
  console.log('Confidence:', historyRecord.confidence.value.toFixed(3));
  console.log('Reason:', historyRecord.reason);

  // Note: Commented out to avoid actual Firestore writes in example
  // await lineageQueryService.storeHistoryRecord(historyRecord);
}

/**
 * Example: Updating weapon data with new information
 */
async function updateWeaponData() {
  console.log('\n\n=== Updating Weapon Data Example ===\n');

  const weaponId = 'ak47_cold_war';
  const field = 'damage';

  // Existing field (from previous example)
  const existingSources: SourceRecord[] = [
    {
      source: DataSource.CODARMORY,
      value: 35,
      timestamp: Date.now() - 24 * 60 * 60 * 1000, // 1 day ago
    },
    {
      source: DataSource.WZSTATS,
      value: 34,
      timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago
    },
  ];

  const existingField = lineageTracker.createMultiSourceField(
    existingSources,
    field
  );

  console.log('Existing Data:');
  console.log('Current Value:', existingField.currentValue);
  console.log('Confidence:', existingField.confidence.value.toFixed(3));

  // New data arrives from CODArmory (official update)
  const newSource: SourceRecord = {
    source: DataSource.CODARMORY,
    value: 36, // Balance update!
    timestamp: Date.now(),
    reference: 'patch_v1.5.2',
    notes: 'Weapon balance update - increased damage',
  };

  // Update the field
  const updatedField = lineageTracker.addOrUpdateSource(
    existingField,
    newSource,
    field
  );

  console.log('\nUpdated Data:');
  console.log('New Value:', updatedField.currentValue);
  console.log('New Confidence:', updatedField.confidence.value.toFixed(3));
  console.log('Change Detected:', !lineageTracker.valuesEqual(
    existingField.currentValue,
    updatedField.currentValue
  ));

  // Create history record for the change
  if (
    !lineageTracker.valuesEqual(
      existingField.currentValue,
      updatedField.currentValue
    )
  ) {
    const changeRecord = lineageTracker.createHistoryRecord(
      weaponId,
      field,
      existingField.currentValue,
      updatedField.currentValue,
      newSource.source,
      updatedField.confidence.quality,
      'Weapon balance update - patch v1.5.2',
      newSource.reference
    );

    console.log('\nChange History Record:');
    console.log('Old Value:', changeRecord.oldValue);
    console.log('New Value:', changeRecord.newValue);
    console.log('Reason:', changeRecord.reason);
    console.log('Reference:', changeRecord.reference);
  }
}

/**
 * Example: Batch processing multiple weapons
 */
async function batchProcessWeapons() {
  console.log('\n\n=== Batch Processing Example ===\n');

  const weapons = ['ak47', 'm4a1', 'grau', 'kilo', 'amax'];
  const historyRecords = [];

  for (const weaponId of weapons) {
    // Simulate collecting data from multiple sources
    const sources: SourceRecord[] = [
      {
        source: DataSource.CODARMORY,
        value: Math.floor(Math.random() * 20) + 30,
        timestamp: Date.now(),
      },
      {
        source: DataSource.WZSTATS,
        value: Math.floor(Math.random() * 20) + 30,
        timestamp: Date.now() - 60 * 60 * 1000,
      },
    ];

    const field = lineageTracker.createMultiSourceField(sources, 'damage');

    const record = lineageTracker.createHistoryRecord(
      weaponId,
      'damage',
      null,
      field.currentValue,
      field.primarySource,
      field.confidence.quality
    );

    historyRecords.push(record);
  }

  console.log(`Created ${historyRecords.length} history records`);
  console.log('\nSample Records:');
  historyRecords.slice(0, 3).forEach((record) => {
    console.log(
      `  ${record.weaponId}: ${record.newValue} (confidence: ${record.confidence.value.toFixed(3)})`
    );
  });

  // Note: Commented out to avoid actual Firestore writes
  // await lineageQueryService.batchStoreHistory(historyRecords);
  console.log('\n(Batch store commented out - would save to Firestore)');
}

/**
 * Example: Computing statistics
 */
async function computeStatistics() {
  console.log('\n\n=== Statistics Example ===\n');

  // Create sample data
  const sampleRecords = [
    lineageTracker.createHistoryRecord(
      'weapon1',
      'damage',
      null,
      35,
      DataSource.CODARMORY,
      1.0
    ),
    lineageTracker.createHistoryRecord(
      'weapon1',
      'range',
      null,
      25,
      DataSource.WZSTATS,
      0.9
    ),
    lineageTracker.createHistoryRecord(
      'weapon2',
      'damage',
      null,
      40,
      DataSource.CODARMORY,
      1.0
    ),
    lineageTracker.createHistoryRecord(
      'weapon2',
      'damage',
      40,
      42,
      DataSource.CODARMORY,
      1.0
    ),
  ];

  console.log('Sample Data Created:');
  console.log('Total Records:', sampleRecords.length);
  console.log('Unique Weapons:', new Set(sampleRecords.map((r) => r.weaponId)).size);
  console.log('Unique Fields:', new Set(sampleRecords.map((r) => r.field)).size);

  // Calculate quality metrics
  const avgConfidence =
    sampleRecords.reduce((sum, r) => sum + r.confidence.value, 0) /
    sampleRecords.length;

  console.log('\nQuality Metrics:');
  console.log('Average Confidence:', avgConfidence.toFixed(3));
  console.log('High Confidence Records (>0.9):',
    sampleRecords.filter((r) => r.confidence.value > 0.9).length
  );
}

/**
 * Run all examples
 */
async function runExamples() {
  try {
    await trackWeaponData();
    await updateWeaponData();
    await batchProcessWeapons();
    await computeStatistics();

    console.log('\n\n=== All Examples Completed Successfully ===\n');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Run examples if executed directly
if (require.main === module) {
  runExamples();
}
