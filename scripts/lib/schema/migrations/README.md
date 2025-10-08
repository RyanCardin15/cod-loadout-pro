# Schema Migration System

Complete migration system for upgrading weapon schemas from V1 (flat) → V2 (with metadata) → V3 (UnifiedWeapon with MultiSourceField).

## Overview

The migration system provides safe, idempotent migration of weapon data across three schema versions:

- **V1**: Simple flat schema with basic stats
- **V2**: Enhanced schema with source metadata and lineage tracking
- **V3**: Unified schema with MultiSourceField wrappers and full lineage support

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│           Schema Version Manager                        │
│  - Detect current schema version                        │
│  - Validate schema compatibility                        │
│  - Track migration history                              │
└─────────────────┬───────────────────────────────────────┘
                  │
       ┌──────────┴──────────┐
       │                     │
┌──────▼────────┐    ┌──────▼────────┐
│  V1 → V2      │    │  V2 → V3      │
│  Migration    │    │  Migration    │
│  - Add meta   │    │  - Convert to │
│  - Add source │    │    MultiField │
└──────┬────────┘    └──────┬────────┘
       │                     │
       └──────────┬──────────┘
                  │
         ┌────────▼────────┐
         │ Batch Migrator  │
         │ - Paginate      │
         │ - Progress log  │
         │ - Error handle  │
         └─────────────────┘
```

## Usage

### Command Line

Migrate all weapons to V3:
```bash
npm run data:migrate
```

Dry-run (test without writing):
```bash
npm run data:migrate:dry-run
# or
npm run data:migrate -- --dry-run
```

Migrate to V2 only:
```bash
npm run data:migrate:v2
# or
npm run data:migrate -- --target v2
```

Custom batch size:
```bash
npm run data:migrate -- --batch-size 50
```

Continue on errors:
```bash
npm run data:migrate -- --continue-on-error
```

Verbose logging:
```bash
npm run data:migrate -- --verbose
```

### Programmatic Usage

```typescript
import {
  schemaVersionManager,
  migrateV1ToV2,
  migrateV2ToV3,
} from './lib/schema';

// Detect version
const version = schemaVersionManager.detectVersion(weapon);

// Migrate V1 → V2
if (version === 'v1') {
  const v2Weapon = migrateV1ToV2(weapon);
}

// Migrate V2 → V3
if (version === 'v2') {
  const v3Weapon = migrateV2ToV3(weapon);
}

// Check migration history
const history = await schemaVersionManager.getMigrationHistory(weaponId);

// Get statistics
const stats = await schemaVersionManager.getMigrationStats();
```

## Migration Details

### V1 → V2 Migration

**What Changes:**
- Adds `schemaVersion: 'v2'`
- Adds `lineageMetadata` object
- Adds `dataSource` field
- Adds `sourceMetadata` with primary source tracking

**What Stays the Same:**
- All stat values unchanged
- All meta fields unchanged
- All ballistics data unchanged

**Data Source Inference:**
- Checks for CODArmory indicators (imageUrl patterns)
- Checks for WZStats patterns (tier + popularity)
- Checks for detailed ballistics (CODArmory)
- Defaults to 'unknown' if can't determine

### V2 → V3 Migration

**What Changes:**
- Wraps all stats in `WeaponStatField` (MultiSourceField)
- Wraps all meta in `WeaponMetaField` (MultiSourceField)
- Wraps ballistics in `MultiSourceField`
- Creates full `lineage` object
- Adds `createdAt` and `updatedAt` timestamps

**Data Preservation:**
- Original values preserved in `currentValue`
- Source preserved in `primarySource`
- Timestamp preserved in `lastUpdated`
- Confidence calculated based on source reliability

**Example:**
```typescript
// V2: damage: 80
// V3: damage: {
//   currentValue: 80,
//   primarySource: 'codarmory',
//   sources: [{ source: 'codarmory', value: 80, timestamp: ... }],
//   confidence: { value: 0.85, ... },
//   lastUpdated: ...,
//   hasConflict: false
// }
```

## Safety Features

### Idempotency
Running migration multiple times is safe. Already-migrated weapons are skipped.

### Validation
- Pre-migration validation (can this be migrated?)
- Post-migration validation (is result valid?)
- Schema validation (does it match expected structure?)

### Rollback
V2 → V1 rollback supported (for testing). Caution: loses source tracking.

### Error Handling
- Comprehensive error catching
- Detailed error messages
- Optional continue-on-error mode
- Transaction-like batch processing

### Dry-Run Mode
Test migrations without writing to database:
```bash
npm run data:migrate:dry-run
```

## Migration History

All migrations are recorded in Firestore `schema_migrations` collection:

```typescript
interface MigrationRecord {
  weaponId: string;
  weaponName: string;
  fromVersion: SchemaVersion;
  toVersion: SchemaVersion;
  timestamp: number;
  success: boolean;
  error?: string;
  duration?: number;
}
```

Query migration history:
```typescript
// Get history for specific weapon
const history = await schemaVersionManager.getMigrationHistory(weaponId);

// Get recent migrations (last 50)
const recent = await schemaVersionManager.getRecentMigrations(50);

// Get statistics
const stats = await schemaVersionManager.getMigrationStats();
```

## Statistics

Get comprehensive migration statistics:

```typescript
const stats = await schemaVersionManager.getMigrationStats();

console.log(`Total weapons: ${stats.total}`);
console.log(`V1: ${stats.byVersion.v1}`);
console.log(`V2: ${stats.byVersion.v2}`);
console.log(`V3: ${stats.byVersion.v3}`);
console.log(`Migrated: ${stats.migrated}`);
console.log(`Pending: ${stats.pending}`);
console.log(`Average duration: ${stats.averageDuration}ms`);
```

## Files

### Core Components
- `schema-version-manager.ts` - Version detection, validation, history tracking
- `v1-to-v2.migration.ts` - V1 → V2 migration logic
- `v2-to-v3.migration.ts` - V2 → V3 migration logic
- `index.ts` - Exports for all migration functions

### Scripts
- `../../migrate-weapons.ts` - Batch migration orchestrator CLI

### Tests
- `__tests__/schema-version-manager.test.ts`
- `__tests__/v1-to-v2.migration.test.ts`
- `__tests__/v2-to-v3.migration.test.ts`

## Best Practices

### Before Migration
1. **Backup Database**: Create Firestore backup
2. **Test Dry-Run**: Run with `--dry-run` first
3. **Check Statistics**: Understand current state
4. **Read Logs**: Review what will change

### During Migration
1. **Monitor Progress**: Watch console output
2. **Check Errors**: Address errors promptly
3. **Verify Writes**: Spot-check migrated weapons

### After Migration
1. **Validate Results**: Check weapon data integrity
2. **Review History**: Confirm all migrations recorded
3. **Test Application**: Ensure API still works
4. **Monitor Performance**: Watch for issues

## Troubleshooting

### Migration Fails
```bash
# Check version detection
npm run data:migrate -- --dry-run --verbose

# Continue on error to process all
npm run data:migrate -- --continue-on-error
```

### Validation Errors
Check the error details in output. Common issues:
- Missing required fields
- Invalid stat values
- Malformed source metadata

### Rollback
To rollback V2 to V1 (testing only):
```typescript
import { rollbackV2ToV1 } from './migrations/v1-to-v2.migration';
const v1Weapon = rollbackV2ToV1(v2Weapon);
```

## Performance

Typical migration rates:
- **V1 → V2**: ~500 weapons/sec
- **V2 → V3**: ~200 weapons/sec (more complex)
- **Batch Size**: 100 weapons (default)

For large databases (>1000 weapons), use:
```bash
npm run data:migrate -- --batch-size 50
```

## Development

### Adding New Migration
1. Create migration file: `vX-to-vY.migration.ts`
2. Implement migration function
3. Add validation function
4. Add to `index.ts` exports
5. Update orchestrator to handle new path
6. Write tests
7. Update this README

### Testing Migrations
```bash
# Run with dry-run mode
npm run data:migrate:dry-run

# Test on single weapon (programmatic)
const migrated = migrateV2ToV3(testWeapon);
const errors = validateV3Migration(migrated);
```

## Security

- Never log sensitive data (API keys, tokens)
- Validate all inputs before migration
- Use Firestore transactions for consistency
- Record all changes in migration history
- Enable audit logging in production

## Support

For issues or questions:
1. Check migration history in Firestore
2. Review error logs
3. Run dry-run with verbose mode
4. Check weapon validation results
