# Schema Migration Quick Start

## TL;DR

```bash
# Test migration (dry-run, no writes)
npm run data:migrate:dry-run

# Run full migration
npm run data:migrate
```

## What It Does

Migrates weapon data through 3 schema versions:

- **V1** → **V2**: Adds source tracking metadata
- **V2** → **V3**: Wraps fields in MultiSourceField with full lineage

## Command Cheat Sheet

```bash
# Dry-run (safe testing)
npm run data:migrate:dry-run

# Full migration to V3
npm run data:migrate

# Migrate to V2 only
npm run data:migrate:v2

# Custom batch size (50 instead of 100)
npm run data:migrate -- --batch-size 50

# Continue if errors occur
npm run data:migrate -- --continue-on-error

# Verbose output
npm run data:migrate -- --verbose

# Combine options
npm run data:migrate -- --dry-run --verbose --batch-size 25
```

## Pre-Flight Checklist

- [ ] Backup Firestore database
- [ ] Run dry-run first: `npm run data:migrate:dry-run`
- [ ] Check output for errors
- [ ] Verify weapon count matches expectations
- [ ] Ensure Firebase credentials are set in .env

## What Gets Changed

### V1 Weapons
```json
{
  "id": "ak47",
  "name": "AK-47",
  "stats": {
    "damage": 80  // ← Flat number
  }
}
```

### V2 Weapons (After V1→V2)
```json
{
  "id": "ak47",
  "name": "AK-47",
  "stats": {
    "damage": 80,  // ← Still flat
    "source": "codarmory",  // ← Added
    "updatedAt": 1234567890
  },
  "sourceMetadata": {  // ← Added
    "primarySource": "codarmory",
    "lastFetchedAt": 1234567890,
    "reliability": 0.9
  }
}
```

### V3 Weapons (After V2→V3)
```json
{
  "id": "ak47",
  "name": "AK-47",
  "stats": {
    "damage": {  // ← MultiSourceField wrapper
      "currentValue": 80,
      "primarySource": "codarmory",
      "sources": [
        {
          "source": "codarmory",
          "value": 80,
          "timestamp": 1234567890
        }
      ],
      "confidence": {
        "value": 0.85,
        "sourceReliability": 0.9,
        "freshness": 0.95,
        "quality": 1.0
      },
      "lastUpdated": 1234567890,
      "hasConflict": false
    }
  },
  "lineage": {  // ← Added
    "totalSources": 1,
    "averageConfidence": 0.85,
    "conflictCount": 0,
    "staleDataCount": 0,
    "lastUpdated": 1234567890,
    "lastValidated": 1234567890,
    "contributingSources": ["codarmory"]
  }
}
```

## Safety Features

1. **Idempotent**: Run multiple times safely
2. **Dry-Run**: Test without writing
3. **Validation**: Pre and post-migration checks
4. **History**: All migrations recorded in Firestore
5. **Rollback**: V2→V1 rollback available (testing only)
6. **Error Handling**: Detailed error reporting

## Monitoring

### During Migration
Watch console output:
- ✅ Success indicators
- ❌ Error indicators
- 📦 Batch progress
- ⏱️ Timing statistics

### After Migration
```typescript
// Get migration statistics
const stats = await schemaVersionManager.getMigrationStats();
console.log(stats);

// Check weapon history
const history = await schemaVersionManager.getMigrationHistory(weaponId);
console.log(history);
```

## Troubleshooting

### Migration Fails
```bash
# Run in dry-run with verbose
npm run data:migrate -- --dry-run --verbose

# Continue processing on error
npm run data:migrate -- --continue-on-error
```

### Validation Errors
Check console output for specific errors:
- Missing required fields
- Invalid stat ranges
- Malformed source metadata

### Performance Issues
```bash
# Reduce batch size
npm run data:migrate -- --batch-size 25
```

## Common Scenarios

### First Time Migration
```bash
npm run data:migrate:dry-run  # Test
npm run data:migrate          # Execute
```

### Re-run After Errors
```bash
# Migration is idempotent - just run again
npm run data:migrate
```

### Migrate New Weapons Only
```bash
# All weapons checked, only unmigrated are processed
npm run data:migrate
```

## Support

- Check `README.md` for full documentation
- View migration history in Firestore `schema_migrations` collection
- Test individual weapons with `test-migration-system.ts`

## Example Output

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔄  WEAPON SCHEMA MIGRATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Configuration:
  Target Version: v3
  Batch Size: 100
  Dry Run: NO
  Continue on Error: NO

🔌 Initializing Firebase...
📥 Fetching weapons from database...
Found 247 weapons

🚀 Starting migration (batches of 100)...

📦 Batch 1/3 (100 weapons):
  ✅ AK-47 (v1 → v3) - 45ms
  ✅ M4A1 (v1 → v3) - 42ms
  ✅ MP5 (v2 → v3) - 38ms
  ...
  Batch completed in 4200ms

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊  MIGRATION SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total Weapons: 247
✅ Migrated: 247
⏭️  Skipped: 0
❌ Errors: 0
⏱️  Duration: 12.45s
📈 Rate: 19.84 weapons/sec

💾 Changes written to database
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
