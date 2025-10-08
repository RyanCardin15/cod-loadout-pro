/**
 * Schema Module - Multi-Source Data Integration
 *
 * Central export point for all schema-related utilities including:
 * - Conflict resolution strategies
 * - Schema merging operations
 * - Data lineage tracking
 * - Schema version management and migrations
 */

// Export conflict resolver
export {
  ConflictResolver,
  conflictResolver,
  SOURCE_PRIORITY,
  type ResolutionStrategy,
  type ResolutionResult,
  type ConflictDetectionConfig,
} from './conflict-resolver';

// Export schema merger
export {
  SchemaMerger,
  schemaMerger,
  extractWeaponId,
  weaponsMatch,
  mergeAttachments,
  type SourcedWeaponData,
  type MergeConfig,
  type MergeResult,
} from './schema-merger';

// Export schema version manager
export {
  SchemaVersionManager,
  schemaVersionManager,
  type SchemaVersion,
  type MigrationRecord,
  type MigrationStats,
} from './schema-version-manager';

// Export migration functions
export {
  migrateV1ToV2,
  batchMigrateV1ToV2,
  canMigrateV1ToV2,
  rollbackV2ToV1,
  migrateV2ToV3,
  batchMigrateV2ToV3,
  canMigrateV2ToV3,
  validateV3Migration,
  createMigrationReport,
} from './migrations';

// Re-export lineage types for convenience
export {
  DataSource,
  SOURCE_RELIABILITY,
  DEFAULT_CONFIDENCE_CONFIG,
  type SourceRecord,
  type MultiSourceField,
  type ConfidenceScore,
  type ConflictDetail,
  type DataLineage,
  type LineageMetadata,
  type LineageHistoryRecord,
  type LineageQueryFilters,
  type LineageStatistics,
  type ConfidenceConfig,
  type FieldHistoryEntry,
  type FieldHistory,
} from '../lineage/lineage-schema';

// Re-export unified weapon model types for convenience
export {
  type UnifiedWeapon,
  type WeaponV1,
  type WeaponV2,
  type WeaponStatField,
  type WeaponMetaField,
  type WeaponResponse,
  type BalancePatch,
  type BalanceChange,
  toWeaponResponse,
  v1ToV3,
  v2ToV3,
  isWeaponV1,
  isWeaponV2,
  isUnifiedWeapon,
} from '../../../server/src/models/unified-weapon.model';
