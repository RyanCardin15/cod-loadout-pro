#!/usr/bin/env tsx
import 'dotenv/config';
import { initializeFirebase, db } from '../server/src/firebase/admin';

async function checkWeaponById() {
  console.log('🔍 Checking weapon by ID...\n');

  initializeFirebase();

  // Check "Striker" which has a migration record
  const weaponId = '6cOuDZj0DyDj8kp2uVMR';
  const weaponDoc = await db().collection('weapons').doc(weaponId).get();

  if (!weaponDoc.exists) {
    console.log('❌ Weapon not found');
    return;
  }

  const data = weaponDoc.data();

  console.log('📋 Weapon ID:', weaponDoc.id);
  console.log('📋 Weapon Name:', data?.name);
  console.log('\n📊 Schema Check:');
  console.log('-------------------');
  console.log(`Has schemaVersion? ${!!data?.schemaVersion}`);
  console.log(`SchemaVersion: ${data?.schemaVersion}`);
  console.log(`Has lineageMetadata? ${!!data?.lineageMetadata}`);
  console.log(`Has sourceMetadata? ${!!data?.sourceMetadata}`);
  console.log(`Stats.damage type: ${typeof data?.stats?.damage}`);

  if (typeof data?.stats?.damage === 'object') {
    console.log('\n✅ V3 Schema Detected!');
    console.log('Stats.damage:', JSON.stringify(data.stats.damage, null, 2));
  } else {
    console.log(`Stats.damage value: ${data?.stats?.damage}`);
    console.log('\n⚠️ Still V1 Schema');
  }

  console.log('\n📄 Full document:');
  console.log(JSON.stringify(data, null, 2));
}

checkWeaponById()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
