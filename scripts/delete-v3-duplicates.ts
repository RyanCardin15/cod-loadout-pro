#!/usr/bin/env tsx
import 'dotenv/config';
import { initializeFirebase, db } from '../server/src/firebase/admin';
import { schemaVersionManager } from './lib/schema/schema-version-manager';

async function deleteV3Duplicates() {
  console.log('🔍 Finding V3 duplicate documents to delete...\n');

  initializeFirebase();

  const weaponsSnapshot = await db().collection('weapons').get();

  const v3Weapons: any[] = [];

  weaponsSnapshot.forEach((doc) => {
    const weapon = { id: doc.id, ...doc.data() };
    const version = schemaVersionManager.detectVersion(weapon);

    if (version === 'v3') {
      v3Weapons.push({
        docId: doc.id,
        name: weapon.name,
        internalId: weapon.id,
      });
    }
  });

  console.log(`📊 Found ${v3Weapons.length} V3 documents to delete\n`);

  if (v3Weapons.length === 0) {
    console.log('✅ No V3 documents to delete');
    return;
  }

  console.log('Sample V3 documents (first 5):');
  v3Weapons.slice(0, 5).forEach((w) => {
    console.log(`  - ${w.name} (Doc ID: ${w.docId.substring(0, 8)}...)`);
  });

  console.log('\n⚠️  WARNING: This will permanently delete these documents!');
  console.log(
    '   Only continue if you understand that these are duplicates created by the migration bug.\n'
  );

  // Delete all V3 documents
  console.log('🗑️  Deleting V3 duplicate documents...\n');

  const batch = db().batch();
  let deleteCount = 0;

  for (const weapon of v3Weapons) {
    const docRef = db().collection('weapons').doc(weapon.docId);
    batch.delete(docRef);
    deleteCount++;

    if (deleteCount % 10 === 0) {
      console.log(`  Queued ${deleteCount}/${v3Weapons.length} for deletion...`);
    }
  }

  await batch.commit();

  console.log(`\n✅ Deleted ${deleteCount} V3 duplicate documents`);

  // Verify
  const remainingSnapshot = await db().collection('weapons').get();
  console.log(`\n📊 Remaining weapons in database: ${remainingSnapshot.size}`);

  // Count by version
  let v1Count = 0;
  let v2Count = 0;
  let v3Count = 0;

  remainingSnapshot.forEach((doc) => {
    const weapon = { id: doc.id, ...doc.data() };
    const version = schemaVersionManager.detectVersion(weapon);
    if (version === 'v1') v1Count++;
    else if (version === 'v2') v2Count++;
    else if (version === 'v3') v3Count++;
  });

  console.log(`   V1: ${v1Count}`);
  console.log(`   V2: ${v2Count}`);
  console.log(`   V3: ${v3Count}`);
}

deleteV3Duplicates()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
