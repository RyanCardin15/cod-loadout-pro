/**
 * Verify all exports are accessible
 */

import {
  // Types
  ConfidenceScore,
  ConfidenceConfig,
  DataLineage,
  MultiSourceField,
  SourceRecord,
  ConflictDetail,
  LineageMetadata,
  LineageHistoryRecord,
  LineageQueryFilters,
  LineageStatistics,
  FieldHistory,
  FieldHistoryEntry,
  // Enums and Constants
  DataSource,
  SOURCE_RELIABILITY,
  DEFAULT_CONFIDENCE_CONFIG,
  // Classes and Instances
  LineageTracker,
  lineageTracker,
  LineageQueryService,
  lineageQueryService,
} from './index';

console.log('All exports verified successfully!');
console.log('Available DataSources:', Object.keys(DataSource));
console.log('Default decay rate:', DEFAULT_CONFIDENCE_CONFIG.freshnessDecayRate);
console.log('Lineage tracker instance:', typeof lineageTracker);
console.log('Query service instance:', typeof lineageQueryService);
