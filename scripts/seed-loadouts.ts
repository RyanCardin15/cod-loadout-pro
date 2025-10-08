#!/usr/bin/env tsx

import 'dotenv/config';
import { initializeFirebase, db } from '../server/src/firebase/admin';

/**
 * Seed sample loadouts using real weapons and attachments from database
 */
async function seedLoadouts() {
  console.log('🎮 Seeding sample loadouts...');

  initializeFirebase();

  // Fetch S and A tier weapons
  const weaponsSnapshot = await db()
    .collection('weapons')
    .where('meta.tier', 'in', ['S', 'A'])
    .limit(10)
    .get();

  if (weaponsSnapshot.empty) {
    console.log('⚠️  No weapons found. Run data:init first.');
    return;
  }

  const weapons = weaponsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];

  // Fetch some attachments
  const attachmentsSnapshot = await db()
    .collection('attachments')
    .limit(50)
    .get();

  const attachments = attachmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];

  // Create sample loadouts
  const loadouts = [];
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < Math.min(5, weapons.length); i++) {
    const weapon = weapons[i];

    // Select 5 random attachments
    const selectedAttachments = [];
    const slots = ['optic', 'barrel', 'magazine', 'underbarrel', 'stock'];

    for (const slot of slots) {
      const slotAttachment = attachments.find(a => a.slot === slot) || {
        id: `${slot}-${i}`,
        name: `Default ${slot}`,
        slot,
      };

      selectedAttachments.push({
        id: slotAttachment.id,
        name: slotAttachment.name,
        slot: slotAttachment.slot,
      });
    }

    const loadout = {
      userId: 'system',
      name: `${weapon.name} ${weapon.meta.tier}-Tier Build`,
      game: weapon.game,
      primary: {
        weapon: {
          id: weapon.id,
          name: weapon.name,
          category: weapon.category,
          meta: { tier: weapon.meta.tier },
        },
        attachments: selectedAttachments,
      },
      perks: {
        perk1: 'Double Time',
        perk2: 'Sleight of Hand',
        perk3: 'Tempered',
        perk4: 'Quick Fix',
      },
      equipment: {
        lethal: 'Frag Grenade',
        tactical: 'Flash Grenade',
        fieldUpgrade: 'Trophy System',
      },
      playstyle: weapon.playstyles?.[0] || 'Tactical',
      effectiveRange: weapon.bestFor?.[0] || 'Medium Range',
      difficulty: 'Medium',
      overallRating: weapon.meta.tier === 'S' ? 4.7 : 4.3,
      favorites: Math.floor(Math.random() * 200) + 50,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await db().collection('loadouts').add(loadout);
      console.log(`  ✅ Created: ${loadout.name}`);
      successCount++;
    } catch (error) {
      console.log(`  ❌ Failed to create loadout for ${weapon.name}`);
      errorCount++;
    }
  }

  console.log(`\n📊 Loadout Seeding Summary:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
}

seedLoadouts()
  .then(() => {
    console.log('\n✅ Loadout seeding complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error seeding loadouts:', error);
    process.exit(1);
  });
