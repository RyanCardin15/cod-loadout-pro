#!/usr/bin/env tsx
import 'dotenv/config';
import { initializeFirebase, db } from '../server/src/firebase/admin';
import { schemaVersionManager } from './lib/schema/schema-version-manager';

async function findRiotShield() {
  console.log('🔍 Finding all Riot Shield weapons...\n');

  initializeFirebase();

  // Get all weapons named "Riot Shield"
  const weaponsSnapshot = await db()
    .collection('weapons')
    .where('name', '==', 'Riot Shield')
    .get();

  console.log(`Found ${weaponsSnapshot.size} weapons named "Riot Shield"\n`);

  weaponsSnapshot.forEach((doc) => {
    const weapon = { id: doc.id, ...doc.data() };
    const version = schemaVersionManager.detectVersion(weapon);

    console.log('---');
    console.log('Document ID:', doc.id);
    console.log('Name:', weapon.name);
    console.log('Schema Version:', version);
    console.log('Stats.damage type:', typeof weapon.stats?.damage);
    console.log('Has lineageMetadata?', !!weapon.lineageMetadata);
    console.log('createdAt:', weapon.createdAt);
    console.log('updatedAt:', weapon.updatedAt);
  });

  // Check migration records for Riot Shield
  console.log('\n\n🔍 Migration records for Riot Shield:\n');

  const migrationsSnapshot = await db()
    .collection('schema_migrations')
    .where('weaponName', '==', 'Riot Shield')
    .get();

  console.log(`Found ${migrationsSnapshot.size} migration records\n`);

  migrationsSnapshot.forEach((doc) => {
    const data = doc.data();
    console.log('---');
    console.log('Weapon ID:', data.weaponId);
    console.log('From:', data.fromVersion, '→ To:', data.toVersion);
    console.log('Timestamp:', new Date(data.timestamp).toISOString());
    console.log('Success:', data.success);
  });
}

findRiotShield()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
