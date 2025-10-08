/**
 * Data Lineage Tracking System
 *
 * Complete system for tracking data sources, confidence scores,
 * and data quality across weapon data collection.
 *
 * @module lineage
 */

// Export all schema types
export type {
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
} from './lineage-schema';

// Export enums and constants
export {
  DataSource,
  SOURCE_RELIABILITY,
  DEFAULT_CONFIDENCE_CONFIG,
} from './lineage-schema';

// Export tracker
export { LineageTracker, lineageTracker } from './lineage-tracker';

// Export query service
export {
  LineageQueryService,
  lineageQueryService,
} from './lineage-query';
