#!/usr/bin/env tsx
import 'dotenv/config';
import { initializeFirebase, db } from '../server/src/firebase/admin';

async function checkSchema() {
  console.log('🔍 Checking weapon schema in database...\n');

  initializeFirebase();

  // Get one weapon to see its structure
  const snapshot = await db().collection('weapons').limit(1).get();

  if (snapshot.empty) {
    console.log('❌ No weapons found in database');
    return;
  }

  const weapon = snapshot.docs[0];
  const data = weapon.data();

  console.log('📋 Weapon ID:', weapon.id);
  console.log('📋 Weapon Name:', data.name);
  console.log('\n📊 Full Structure:');
  console.log(JSON.stringify(data, null, 2));

  console.log('\n\n🔍 Schema Analysis:');
  console.log('-------------------');
  console.log(`Has stats? ${!!data.stats}`);
  console.log(`Stats type: ${typeof data.stats}`);
  if (data.stats) {
    console.log(`Stats keys: ${Object.keys(data.stats).join(', ')}`);
    console.log(`Damage type: ${typeof data.stats.damage}`);
    if (typeof data.stats.damage === 'object') {
      console.log(`Damage structure: ${JSON.stringify(data.stats.damage, null, 2)}`);
    }
  }

  console.log(`\nHas meta? ${!!data.meta}`);
  console.log(`Meta type: ${typeof data.meta}`);
  if (data.meta) {
    console.log(`Meta keys: ${Object.keys(data.meta).join(', ')}`);
    console.log(`Tier type: ${typeof data.meta.tier}`);
    if (typeof data.meta.tier === 'object') {
      console.log(`Tier structure: ${JSON.stringify(data.meta.tier, null, 2)}`);
    }
  }

  console.log(`\nHas schemaVersion? ${!!data.schemaVersion}`);
  console.log(`SchemaVersion: ${data.schemaVersion}`);

  console.log(`\nHas lineageMetadata? ${!!data.lineageMetadata}`);
}

checkSchema()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
