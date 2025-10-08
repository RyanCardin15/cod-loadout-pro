#!/usr/bin/env tsx
import 'dotenv/config';
import { initializeFirebase, db } from '../server/src/firebase/admin';

async function listCurrentWeapons() {
  console.log('🔍 Listing current weapons in database...\n');

  initializeFirebase();

  const weaponsSnapshot = await db().collection('weapons').get();

  const weaponNames = weaponsSnapshot.docs
    .map((doc) => doc.data().name)
    .sort();

  console.log(`📊 Total weapons: ${weaponNames.length}\n`);
  console.log('Weapon names:');
  weaponNames.forEach((name, i) => {
    console.log(`${String(i + 1).padStart(3, ' ')}. ${name}`);
  });
}

listCurrentWeapons()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
