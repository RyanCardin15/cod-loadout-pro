#!/usr/bin/env tsx
import 'dotenv/config';
import { initializeFirebase, db } from '../server/src/firebase/admin';
import { schemaVersionManager } from './lib/schema/schema-version-manager';

async function findDuplicates() {
  console.log('🔍 Finding duplicate weapons...\n');

  initializeFirebase();

  const weaponsSnapshot = await db().collection('weapons').get();

  // Group weapons by name
  const weaponsByName = new Map<string, any[]>();

  weaponsSnapshot.forEach((doc) => {
    const weapon = { id: doc.id, ...doc.data() };
    const existing = weaponsByName.get(weapon.name) || [];
    existing.push(weapon);
    weaponsByName.set(weapon.name, existing);
  });

  // Find duplicates
  const duplicates = Array.from(weaponsByName.entries())
    .filter(([_, weapons]) => weapons.length > 1)
    .sort((a, b) => b[1].length - a[1].length);

  console.log(`📊 Total Weapons: ${weaponsSnapshot.size}`);
  console.log(`📊 Unique Weapon Names: ${weaponsByName.size}`);
  console.log(`📊 Duplicated Names: ${duplicates.length}\n`);

  if (duplicates.length > 0) {
    console.log('🔍 Duplicate Weapons:\n');

    for (const [name, weapons] of duplicates.slice(0, 10)) {
      console.log(`${name} (${weapons.length} copies):`);

      for (const weapon of weapons) {
        const version = schemaVersionManager.detectVersion(weapon);
        const createdAt = weapon.createdAt
          ? new Date(weapon.createdAt).toISOString()
          : 'unknown';

        console.log(
          `  - ${weapon.id.substring(0, 8)}... [${version}] created: ${createdAt}`
        );
      }

      console.log();
    }

    if (duplicates.length > 10) {
      console.log(`... and ${duplicates.length - 10} more duplicated names\n`);
    }

    // Count total duplicate documents
    const totalDuplicateDocs = duplicates.reduce(
      (sum, [_, weapons]) => sum + weapons.length - 1,
      0
    );

    console.log(`\n📈 Statistics:`);
    console.log(`   Total duplicate documents: ${totalDuplicateDocs}`);
    console.log(`   Expected count after cleanup: ${weaponsSnapshot.size - totalDuplicateDocs}`);
  }
}

findDuplicates()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
