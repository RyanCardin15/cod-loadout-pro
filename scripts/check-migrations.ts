#!/usr/bin/env tsx
import 'dotenv/config';
import { initializeFirebase, db } from '../server/src/firebase/admin';

async function checkMigrations() {
  console.log('🔍 Checking migration records...\n');

  initializeFirebase();

  // Check schema_migrations collection
  const migrationsSnapshot = await db().collection('schema_migrations').limit(5).get();

  console.log(`📋 Found ${migrationsSnapshot.size} migration records\n`);

  if (migrationsSnapshot.empty) {
    console.log('❌ No migration records found');
    return;
  }

  migrationsSnapshot.forEach(doc => {
    const data = doc.data();
    console.log('Migration Record:');
    console.log(JSON.stringify(data, null, 2));
    console.log('---');
  });

  // Check one weapon to see if it has V3 structure
  const weaponSnapshot = await db().collection('weapons').where('name', '==', 'M4').limit(1).get();

  if (!weaponSnapshot.empty) {
    const weapon = weaponSnapshot.docs[0].data();
    console.log('\n📊 M4 Weapon Structure Sample:');
    console.log(`Has lineageMetadata? ${!!weapon.lineageMetadata}`);
    console.log(`Has sourceMetadata? ${!!weapon.sourceMetadata}`);
    console.log(`Stats.damage type: ${typeof weapon.stats?.damage}`);

    if (typeof weapon.stats?.damage === 'object') {
      console.log('\n✅ V3 Schema Detected! (MultiSourceField structure)');
      console.log('Stats.damage structure:', JSON.stringify(weapon.stats.damage, null, 2));
    } else {
      console.log('\n⚠️ Still V1 Schema (flat structure)');
    }
  }
}

checkMigrations()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
