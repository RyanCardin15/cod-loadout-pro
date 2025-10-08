/**
 * Schema Migrations Index
 *
 * Central export point for all schema migration functions.
 */

export {
  migrateV1ToV2,
  batchMigrateV1ToV2,
  canMigrateV1ToV2,
  getMigrationSummary as getV1ToV2Summary,
  rollbackV2ToV1,
} from './v1-to-v2.migration';

export {
  migrateV2ToV3,
  batchMigrateV2ToV3,
  canMigrateV2ToV3,
  getMigrationSummary as getV2ToV3Summary,
  validateV3Migration,
  createMigrationReport,
} from './v2-to-v3.migration';
