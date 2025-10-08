#!/usr/bin/env tsx
import 'dotenv/config';
import { initializeFirebase, db } from '../server/src/firebase/admin';
import { schemaVersionManager } from './lib/schema/schema-version-manager';

async function countSchemaVersions() {
  console.log('🔍 Counting weapons by schema version...\n');

  initializeFirebase();

  const weaponsSnapshot = await db().collection('weapons').get();

  const versionCounts = {
    v1: 0,
    v2: 0,
    v3: 0,
  };

  const v1Weapons: string[] = [];
  const v2Weapons: string[] = [];
  const v3Weapons: string[] = [];

  weaponsSnapshot.forEach(doc => {
    const weapon = { id: doc.id, ...doc.data() };
    const version = schemaVersionManager.detectVersion(weapon);

    versionCounts[version]++;

    if (version === 'v1') v1Weapons.push(weapon.name);
    else if (version === 'v2') v2Weapons.push(weapon.name);
    else if (version === 'v3') v3Weapons.push(weapon.name);
  });

  console.log('📊 Schema Version Distribution:');
  console.log('-------------------');
  console.log(`Total Weapons: ${weaponsSnapshot.size}`);
  console.log(`V1 (flat): ${versionCounts.v1}`);
  console.log(`V2 (lineage): ${versionCounts.v2}`);
  console.log(`V3 (MultiSourceField): ${versionCounts.v3}\n`);

  if (v1Weapons.length > 0 && v1Weapons.length <= 10) {
    console.log('V1 Weapons:', v1Weapons.join(', '));
  } else if (v1Weapons.length > 10) {
    console.log('V1 Weapons (first 10):', v1Weapons.slice(0, 10).join(', '), `... and ${v1Weapons.length - 10} more`);
  }

  if (v2Weapons.length > 0 && v2Weapons.length <= 10) {
    console.log('V2 Weapons:', v2Weapons.join(', '));
  }

  if (v3Weapons.length > 0 && v3Weapons.length <= 10) {
    console.log('V3 Weapons (first 10):', v3Weapons.slice(0, 10).join(', '), v3Weapons.length > 10 ? `... and ${v3Weapons.length - 10} more` : '');
  }
}

countSchemaVersions()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
