#!/usr/bin/env tsx

import 'dotenv/config';
import { initializeFirebase, db } from '../server/src/firebase/admin';

async function createBalanceChanges() {
  console.log('🎮 Creating realistic balance changes...');
  initializeFirebase();

  // Get some random weapons
  const weaponsSnapshot = await db().collection('weapons').limit(15).get();
  const weapons = weaponsSnapshot.docs;

  const changes = [];
  const now = new Date();

  // Create S-tier weapons (5)
  for (let i = 0; i < 5; i++) {
    const weaponDoc = weapons[i];
    const weapon = weaponDoc.data();

    await weaponDoc.ref.update({
      'meta.tier': 'S',
      'meta.popularity': 90 + Math.floor(Math.random() * 10),
      'meta.winRate': 54 + Math.floor(Math.random() * 4),
      'meta.lastUpdated': now.toISOString()
    });

    changes.push({
      weaponId: weaponDoc.id,
      weaponName: weapon.name,
      change: 'buff',
      description: `${weapon.name} moved to S-tier after recent buffs`,
      date: new Date(now.getTime() - (i * 86400000)).toISOString() // Stagger dates by days
    });

    console.log(`  ✅ ${weapon.name} → S-tier (buff)`);
  }

  // Create some B-tier weapons (5)
  for (let i = 5; i < 10; i++) {
    const weaponDoc = weapons[i];
    const weapon = weaponDoc.data();

    await weaponDoc.ref.update({
      'meta.tier': 'B',
      'meta.popularity': 45 + Math.floor(Math.random() * 15),
      'meta.winRate': 49 + Math.floor(Math.random() * 2),
      'meta.lastUpdated': now.toISOString()
    });

    changes.push({
      weaponId: weaponDoc.id,
      weaponName: weapon.name,
      change: 'nerf',
      description: `${weapon.name} nerfed to B-tier`,
      date: new Date(now.getTime() - (i * 86400000)).toISOString()
    });

    console.log(`  ⚠️  ${weapon.name} → B-tier (nerf)`);
  }

  // Create some adjustments (5)
  for (let i = 10; i < 15; i++) {
    const weaponDoc = weapons[i];
    const weapon = weaponDoc.data();

    changes.push({
      weaponId: weaponDoc.id,
      weaponName: weapon.name,
      change: 'adjustment',
      description: `${weapon.name} received minor stat adjustments`,
      date: new Date(now.getTime() - (i * 86400000)).toISOString()
    });

    console.log(`  🔧 ${weapon.name} → adjustment`);
  }

  console.log(`\n📊 Created ${changes.length} balance changes`);

  // Create new meta snapshot with these changes
  const allWeapons = await db().collection('weapons').get();
  const weaponsList = allWeapons.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];

  const tiers = {
    S: weaponsList.filter(w => w.meta.tier === 'S'),
    A: weaponsList.filter(w => w.meta.tier === 'A'),
    B: weaponsList.filter(w => w.meta.tier === 'B'),
    C: weaponsList.filter(w => w.meta.tier === 'C'),
    D: weaponsList.filter(w => w.meta.tier === 'D'),
  };

  const metaSnapshot = {
    game: 'MW3',
    date: now.toISOString(),
    tiers,
    topLoadouts: [],
    recentChanges: changes
  };

  await db().collection('meta_snapshots').add(metaSnapshot);
  console.log('✅ Created meta snapshot with recent changes');

  console.log('\n📈 Tier Distribution:');
  console.log(`   S-Tier: ${tiers.S.length} weapons`);
  console.log(`   A-Tier: ${tiers.A.length} weapons`);
  console.log(`   B-Tier: ${tiers.B.length} weapons`);
  console.log(`   C-Tier: ${tiers.C.length} weapons`);
  console.log(`   D-Tier: ${tiers.D.length} weapons`);
}

createBalanceChanges()
  .then(() => {
    console.log('\n✅ Balance changes created successfully!');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ Error creating balance changes:', err);
    process.exit(1);
  });
