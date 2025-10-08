#!/usr/bin/env tsx
import 'dotenv/config';
import { initializeFirebase, db } from '../server/src/firebase/admin';

async function checkWeaponIds() {
  console.log('🔍 Checking weapon document IDs vs internal IDs...\n');

  initializeFirebase();

  const weaponsSnapshot = await db().collection('weapons').limit(5).get();

  weaponsSnapshot.forEach((doc) => {
    const data = doc.data();
    console.log('---');
    console.log('Firestore Doc ID:', doc.id);
    console.log('Internal id field:', data.id);
    console.log('Match?', doc.id === data.id);
    console.log('Name:', data.name);
  });
}

checkWeaponIds()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
