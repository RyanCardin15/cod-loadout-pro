# Pre-Write Validation for Population Scripts

This guide shows how to use the pre-write validation utilities when creating data population or migration scripts.

## Overview

The pre-write validation system ensures data integrity before writing to Firebase by:
- Validating all data against Zod schemas
- Providing detailed error reports
- Preventing invalid data from being written
- Supporting batch operations with progress tracking

## Quick Start

### Basic Usage

```typescript
import { db } from '@/lib/firebase/admin';
import { validateWeapons, generateValidationReport } from '@/lib/validation/pre-write';
import { weaponSchema } from '@/lib/validation/schemas';

// Example: Populate weapons
async function populateWeapons() {
  const weaponsData = [
    {
      id: 'weapon_ak47_mw3',
      name: 'AK-47',
      game: 'MW3',
      category: 'AR',
      // ... rest of weapon data
    },
    // ... more weapons
  ];

  // Validate before writing
  const validationResult = validateWeapons(weaponsData);

  // Generate and display report
  console.log(generateValidationReport(validationResult, 'weapons'));

  // Only proceed if all items are valid
  if (!validationResult.allValid) {
    console.error('❌ Validation failed. Aborting data population.');
    process.exit(1);
  }

  // Write valid items to Firebase
  console.log('✅ All items valid. Writing to Firebase...');
  let written = 0;

  for (const weapon of validationResult.validItems) {
    await db().collection('weapons').add(weapon);
    written++;
    console.log(`Written: ${written}/${validationResult.validCount}`);
  }

  console.log('✅ Population complete!');
}
```

### Batch Operations with Progress

```typescript
import { validateAndWriteBatch } from '@/lib/validation/pre-write';
import { weaponSchema } from '@/lib/validation/schemas';

async function populateWeaponsBatch() {
  const weaponsData = [...]; // Your weapon data

  const result = await validateAndWriteBatch(
    weaponsData,
    weaponSchema,
    async (weapon) => {
      await db().collection('weapons').add(weapon);
    },
    10, // Batch size
    (progress) => {
      console.log(
        `Progress: ${progress.written}/${progress.validated} written, ${progress.failed} failed`
      );
    }
  );

  console.log('Population Summary:');
  console.log(`  Total validated: ${result.totalValidated}`);
  console.log(`  Successful writes: ${result.successfulWrites}`);
  console.log(`  Failed writes: ${result.failedWrites}`);
  console.log(`  Validation errors: ${result.validationErrors}`);
}
```

## Complete Population Script Example

Create a file: `scripts/populate-initial-data.ts`

```typescript
#!/usr/bin/env ts-node
/**
 * Initial data population script
 *
 * Populates Firebase with initial weapon, attachment, and meta data.
 * Includes comprehensive validation to ensure data integrity.
 */

import { db } from '../src/lib/firebase/admin';
import {
  validateWeapons,
  validateAttachments,
  validateMetaSnapshots,
  generateValidationReport,
} from '../src/lib/validation/pre-write';

// Import your data
import weaponsData from './data/weapons.json';
import attachmentsData from './data/attachments.json';
import metaData from './data/meta.json';

async function main() {
  console.log('🚀 Starting data population...\n');

  // ============================================================================
  // Step 1: Validate Weapons
  // ============================================================================
  console.log('📊 Validating weapons data...');
  const weaponValidation = validateWeapons(weaponsData);
  console.log(generateValidationReport(weaponValidation, 'weapons'));

  if (!weaponValidation.allValid) {
    console.error('❌ Weapon validation failed. Aborting.');
    process.exit(1);
  }

  // ============================================================================
  // Step 2: Validate Attachments
  // ============================================================================
  console.log('\n📊 Validating attachments data...');
  const attachmentValidation = validateAttachments(attachmentsData);
  console.log(generateValidationReport(attachmentValidation, 'attachments'));

  if (!attachmentValidation.allValid) {
    console.error('❌ Attachment validation failed. Aborting.');
    process.exit(1);
  }

  // ============================================================================
  // Step 3: Validate Meta Snapshots
  // ============================================================================
  console.log('\n📊 Validating meta snapshots...');
  const metaValidation = validateMetaSnapshots(metaData);
  console.log(generateValidationReport(metaValidation, 'meta snapshots'));

  if (!metaValidation.allValid) {
    console.error('❌ Meta validation failed. Aborting.');
    process.exit(1);
  }

  // ============================================================================
  // Step 4: Write to Firebase
  // ============================================================================
  console.log('\n✅ All validation passed. Writing to Firebase...\n');

  // Write weapons
  console.log('Writing weapons...');
  for (let i = 0; i < weaponValidation.validItems.length; i++) {
    const weapon = weaponValidation.validItems[i];
    await db().collection('weapons').doc(weapon.id).set(weapon);
    console.log(`  ✓ Weapon ${i + 1}/${weaponValidation.validCount}: ${weapon.name}`);
  }

  // Write attachments
  console.log('\nWriting attachments...');
  for (let i = 0; i < attachmentValidation.validItems.length; i++) {
    const attachment = attachmentValidation.validItems[i];
    await db().collection('attachments').doc(attachment.id).set(attachment);
    console.log(`  ✓ Attachment ${i + 1}/${attachmentValidation.validCount}: ${attachment.name}`);
  }

  // Write meta snapshots
  console.log('\nWriting meta snapshots...');
  for (let i = 0; i < metaValidation.validItems.length; i++) {
    const meta = metaValidation.validItems[i];
    await db().collection('meta_snapshots').doc(meta.id).set(meta);
    console.log(`  ✓ Meta snapshot ${i + 1}/${metaValidation.validCount}: ${meta.game}`);
  }

  // ============================================================================
  // Summary
  // ============================================================================
  console.log('\n' + '='.repeat(60));
  console.log('🎉 Population Complete!');
  console.log('='.repeat(60));
  console.log(`Weapons: ${weaponValidation.validCount} written`);
  console.log(`Attachments: ${attachmentValidation.validCount} written`);
  console.log(`Meta snapshots: ${metaValidation.validCount} written`);
  console.log('='.repeat(60));
}

// Run the script
main()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
```

## Running the Script

Add to `package.json`:

```json
{
  "scripts": {
    "populate": "ts-node scripts/populate-initial-data.ts"
  }
}
```

Run with:

```bash
npm run populate
```

## Validation Features

### Automatic Error Detection

The validation system catches:
- Missing required fields
- Invalid data types
- Out-of-range values
- Invalid enum values
- Malformed URLs
- Invalid datetime strings
- Schema constraint violations

### Detailed Error Reporting

```
==========================================================
Validation Report: weapons
==========================================================
Total items: 100
Valid items: 98
Invalid items: 2
Success rate: 98.00%

INVALID ITEMS:
----------------------------------------------------------

Item #15:
  - stats.damage: Number must be less than or equal to 100
  - imageUrl: Invalid url

Item #42:
  - name: String must contain at least 1 character(s)
  - category: Invalid enum value. Expected 'AR' | 'SMG' | ...

⚠️  WARNING: Some items failed validation and will not be written.
==========================================================
```

## Best Practices

1. **Always validate before writing** - Never skip validation, even for "trusted" data sources

2. **Use batch operations** - For large datasets, use `validateAndWriteBatch` for better performance

3. **Check validation reports** - Review the validation report before proceeding with writes

4. **Handle partial failures** - Decide whether to abort on any failure or continue with valid items

5. **Log validation results** - Save validation reports for audit trails

6. **Test with sample data** - Test your population script with a small subset first

## Error Handling

```typescript
try {
  const result = validateWeapons(weaponsData);

  if (!result.allValid) {
    // Log errors for investigation
    console.error('Validation errors found:');
    result.invalidItems.forEach(({ item, errors, index }) => {
      console.error(`Item ${index}:`, errors.format());
    });

    // Decide: abort or continue with valid items?
    if (result.validCount < result.totalItems * 0.9) {
      // Less than 90% valid - abort
      throw new Error('Too many validation errors');
    }
    // Otherwise, continue with valid items only
  }

  // Proceed with writing...
} catch (error) {
  console.error('Population failed:', error);
  process.exit(1);
}
```

## Integration with CI/CD

Add validation checks to your CI pipeline:

```yaml
# .github/workflows/validate-data.yml
name: Validate Data Files

on:
  pull_request:
    paths:
      - 'data/**/*.json'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run validate-data
```

## Summary

The pre-write validation system provides:
- ✅ Type-safe data validation
- ✅ Detailed error reporting
- ✅ Batch operation support
- ✅ Progress tracking
- ✅ Flexible error handling
- ✅ Integration with CI/CD

Always use these utilities when populating or migrating data to ensure data integrity and prevent issues in production.
