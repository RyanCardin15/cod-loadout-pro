#!/usr/bin/env tsx

import { initializeFirebase, db } from '../server/src/firebase/admin.js';
import { Weapon, Attachment } from '../server/src/models/weapon.model.js';

async function seedWeapons() {
  console.log('🔫 Seeding weapons...');

  const weapons: Omit<Weapon, 'id'>[] = [
    // MW3 Weapons
    {
      name: 'RAM-7',
      game: 'MW3',
      category: 'AR',
      stats: {
        damage: 75,
        range: 70,
        accuracy: 80,
        fireRate: 78,
        mobility: 65,
        control: 72,
        handling: 70
      },
      ballistics: {
        damageRanges: [
          { range: 0, damage: 34 },
          { range: 25, damage: 30 },
          { range: 40, damage: 24 }
        ],
        ttk: { min: 456, max: 628 },
        fireRate: 845,
        magazineSize: 40,
        reloadTime: 2.1,
        adTime: 245
      },
      attachmentSlots: {
        optic: ['optic-ram7-1', 'optic-ram7-2'],
        barrel: ['barrel-ram7-1', 'barrel-ram7-2'],
        magazine: ['mag-ram7-1', 'mag-ram7-2'],
        underbarrel: ['under-ram7-1', 'under-ram7-2'],
        stock: ['stock-ram7-1', 'stock-ram7-2']
      },
      meta: {
        tier: 'S',
        popularity: 87,
        winRate: 54,
        lastUpdated: new Date().toISOString()
      },
      bestFor: ['Ranked', 'Close-Medium range', 'Aggressive play'],
      playstyles: ['Aggressive', 'Tactical'],
      imageUrl: 'https://firebasestorage.googleapis.com/weapons/ram7.png',
      iconUrl: 'https://firebasestorage.googleapis.com/weapons/icons/ram7.png'
    },
    {
      name: 'MCW',
      game: 'MW3',
      category: 'AR',
      stats: {
        damage: 70,
        range: 75,
        accuracy: 85,
        fireRate: 72,
        mobility: 60,
        control: 78,
        handling: 68
      },
      ballistics: {
        damageRanges: [
          { range: 0, damage: 32 },
          { range: 30, damage: 28 },
          { range: 45, damage: 22 }
        ],
        ttk: { min: 480, max: 670 },
        fireRate: 800,
        magazineSize: 30,
        reloadTime: 2.3,
        adTime: 260
      },
      attachmentSlots: {
        optic: ['optic-mcw-1', 'optic-mcw-2'],
        barrel: ['barrel-mcw-1', 'barrel-mcw-2'],
        magazine: ['mag-mcw-1', 'mag-mcw-2'],
        underbarrel: ['under-mcw-1', 'under-mcw-2'],
        stock: ['stock-mcw-1', 'stock-mcw-2']
      },
      meta: {
        tier: 'A',
        popularity: 72,
        winRate: 52,
        lastUpdated: new Date().toISOString()
      },
      bestFor: ['Ranked', 'Medium range', 'Tactical play'],
      playstyles: ['Tactical', 'Support'],
      imageUrl: 'https://firebasestorage.googleapis.com/weapons/mcw.png',
      iconUrl: 'https://firebasestorage.googleapis.com/weapons/icons/mcw.png'
    },
    {
      name: 'Jackal PDW',
      game: 'MW3',
      category: 'SMG',
      stats: {
        damage: 68,
        range: 45,
        accuracy: 65,
        fireRate: 88,
        mobility: 85,
        control: 60,
        handling: 82
      },
      ballistics: {
        damageRanges: [
          { range: 0, damage: 30 },
          { range: 15, damage: 26 },
          { range: 25, damage: 20 }
        ],
        ttk: { min: 400, max: 550 },
        fireRate: 920,
        magazineSize: 50,
        reloadTime: 1.8,
        adTime: 200
      },
      attachmentSlots: {
        optic: ['optic-jackal-1', 'optic-jackal-2'],
        barrel: ['barrel-jackal-1', 'barrel-jackal-2'],
        magazine: ['mag-jackal-1', 'mag-jackal-2'],
        underbarrel: ['under-jackal-1', 'under-jackal-2'],
        stock: ['stock-jackal-1', 'stock-jackal-2']
      },
      meta: {
        tier: 'S',
        popularity: 91,
        winRate: 56,
        lastUpdated: new Date().toISOString()
      },
      bestFor: ['Close range', 'Aggressive play', 'Movement'],
      playstyles: ['Aggressive'],
      imageUrl: 'https://firebasestorage.googleapis.com/weapons/jackal.png',
      iconUrl: 'https://firebasestorage.googleapis.com/weapons/icons/jackal.png'
    },
    // Warzone Weapons
    {
      name: 'XM4',
      game: 'Warzone',
      category: 'AR',
      stats: {
        damage: 72,
        range: 80,
        accuracy: 78,
        fireRate: 75,
        mobility: 62,
        control: 75,
        handling: 65
      },
      ballistics: {
        damageRanges: [
          { range: 0, damage: 35 },
          { range: 35, damage: 31 },
          { range: 50, damage: 25 }
        ],
        ttk: { min: 465, max: 640 },
        fireRate: 825,
        magazineSize: 30,
        reloadTime: 2.4,
        adTime: 275
      },
      attachmentSlots: {
        optic: ['optic-xm4-1', 'optic-xm4-2'],
        barrel: ['barrel-xm4-1', 'barrel-xm4-2'],
        magazine: ['mag-xm4-1', 'mag-xm4-2'],
        underbarrel: ['under-xm4-1', 'under-xm4-2'],
        stock: ['stock-xm4-1', 'stock-xm4-2']
      },
      meta: {
        tier: 'A',
        popularity: 68,
        winRate: 51,
        lastUpdated: new Date().toISOString()
      },
      bestFor: ['Battle Royale', 'Medium-Long range', 'Versatile'],
      playstyles: ['Tactical', 'Support'],
      imageUrl: 'https://firebasestorage.googleapis.com/weapons/xm4.png',
      iconUrl: 'https://firebasestorage.googleapis.com/weapons/icons/xm4.png'
    }
  ];

  const batch = db().batch();

  for (const weapon of weapons) {
    const ref = db().collection('weapons').doc();
    batch.set(ref, weapon);
  }

  await batch.commit();
  console.log(`✅ Seeded ${weapons.length} weapons`);
}

async function seedAttachments() {
  console.log('🔧 Seeding attachments...');

  const attachments: Omit<Attachment, 'id'>[] = [
    // RAM-7 Attachments
    {
      name: 'Corio Eagleseye 2.5x',
      slot: 'optic',
      weaponCompatibility: ['ram7-id'],
      effects: {
        accuracy: 10,
        range: 5,
        mobility: -5,
        handling: -3
      },
      pros: ['Enhanced target acquisition', '2.5x magnification'],
      cons: ['Slower ADS', 'Reduced mobility'],
      imageUrl: 'https://firebasestorage.googleapis.com/attachments/corio-eagleseye.png'
    },
    {
      name: 'Cronen Headhunter',
      slot: 'barrel',
      weaponCompatibility: ['ram7-id'],
      effects: {
        damage: 8,
        range: 15,
        accuracy: 5,
        mobility: -8,
        handling: -5
      },
      pros: ['Increased damage range', 'Better accuracy'],
      cons: ['Slower movement', 'Heavier ADS'],
      imageUrl: 'https://firebasestorage.googleapis.com/attachments/cronen-headhunter.png'
    },
    {
      name: '40 Round Mag',
      slot: 'magazine',
      weaponCompatibility: ['ram7-id'],
      effects: {
        mobility: -3,
        handling: -2
      },
      pros: ['Extended magazine capacity'],
      cons: ['Slightly slower movement'],
      imageUrl: 'https://firebasestorage.googleapis.com/attachments/40-round-mag.png'
    },
    // SMG Attachments
    {
      name: 'Slate Reflector',
      slot: 'optic',
      weaponCompatibility: ['jackal-id'],
      effects: {
        accuracy: 8,
        handling: 3,
        mobility: -2
      },
      pros: ['Clear sight picture', 'Fast target acquisition'],
      cons: ['Minimal mobility reduction'],
      imageUrl: 'https://firebasestorage.googleapis.com/attachments/slate-reflector.png'
    }
  ];

  const batch = db().batch();

  for (const attachment of attachments) {
    const ref = db().collection('attachments').doc();
    batch.set(ref, attachment);
  }

  await batch.commit();
  console.log(`✅ Seeded ${attachments.length} attachments`);
}

async function seedPerks() {
  console.log('⚡ Seeding perks...');

  const perks = [
    // MW3 Perks
    {
      name: 'Double Time',
      game: 'MW3',
      slot: 'perk1',
      description: 'Double the duration of Tactical Sprint',
      category: 'Movement'
    },
    {
      name: 'Overkill',
      game: 'MW3',
      slot: 'perk1',
      description: 'Carry two primary weapons',
      category: 'Weapons'
    },
    {
      name: 'Scavenger',
      game: 'MW3',
      slot: 'perk1',
      description: 'Resupply ammo from fallen enemies',
      category: 'Utility'
    },
    {
      name: 'Quick Fix',
      game: 'MW3',
      slot: 'perk2',
      description: 'Killing an enemy immediately starts health regeneration',
      category: 'Health'
    },
    {
      name: 'Sleight of Hand',
      game: 'MW3',
      slot: 'perk2',
      description: 'Faster reload speed',
      category: 'Weapons'
    },
    {
      name: 'Fast Hands',
      game: 'MW3',
      slot: 'perk2',
      description: 'Faster weapon swap and equipment use',
      category: 'Utility'
    },
    {
      name: 'Tempered',
      game: 'MW3',
      slot: 'perk3',
      description: 'Armor plates fully restore armor',
      category: 'Health'
    },
    {
      name: 'Focus',
      game: 'MW3',
      slot: 'perk3',
      description: 'Reduced flinch when aiming',
      category: 'Combat'
    },
    {
      name: 'Ghost',
      game: 'MW3',
      slot: 'perk4',
      description: 'Undetectable by UAVs and Heartbeat Sensors',
      category: 'Stealth'
    },
    {
      name: 'High Alert',
      game: 'MW3',
      slot: 'perk4',
      description: 'Vision pulses when enemies outside of view have you in their sights',
      category: 'Intel'
    },
    {
      name: 'Birdseye',
      game: 'MW3',
      slot: 'perk4',
      description: 'UAV and Radar pings reveal enemy direction',
      category: 'Intel'
    }
  ];

  const batch = db().batch();

  for (const perk of perks) {
    const ref = db().collection('perks').doc();
    batch.set(ref, perk);
  }

  await batch.commit();
  console.log(`✅ Seeded ${perks.length} perks`);
}

async function seedEquipment() {
  console.log('💣 Seeding equipment...');

  const equipment = [
    // Lethals
    {
      name: 'Frag Grenade',
      type: 'lethal',
      description: 'Cookable fragmentation grenade',
      damage: 'High',
      range: 'Medium'
    },
    {
      name: 'Semtex',
      type: 'lethal',
      description: 'Sticky explosive with a short fuse',
      damage: 'High',
      range: 'Medium'
    },
    {
      name: 'Claymore',
      type: 'lethal',
      description: 'Proximity-activated explosive device',
      damage: 'Very High',
      range: 'Short'
    },
    // Tacticals
    {
      name: 'Stun Grenade',
      type: 'tactical',
      description: 'Slows enemy movement and aim',
      effect: 'Stun',
      duration: '4 seconds'
    },
    {
      name: 'Flash Grenade',
      type: 'tactical',
      description: 'Blinds enemies temporarily',
      effect: 'Flash',
      duration: '3 seconds'
    },
    {
      name: 'Snapshot Grenade',
      type: 'tactical',
      description: 'Reveals enemies through walls',
      effect: 'Intel',
      duration: '5 seconds'
    },
    // Field Upgrades
    {
      name: 'Dead Silence',
      type: 'fieldUpgrade',
      description: 'Move silently for a short duration',
      effect: 'Stealth',
      cooldown: '120 seconds'
    },
    {
      name: 'Trophy System',
      type: 'fieldUpgrade',
      description: 'Destroys incoming projectiles',
      effect: 'Defense',
      cooldown: '90 seconds'
    },
    {
      name: 'Munitions Box',
      type: 'fieldUpgrade',
      description: 'Resupply ammo and equipment',
      effect: 'Utility',
      cooldown: '180 seconds'
    }
  ];

  const batch = db().batch();

  for (const item of equipment) {
    const ref = db().collection('equipment').doc();
    batch.set(ref, item);
  }

  await batch.commit();
  console.log(`✅ Seeded ${equipment.length} equipment items`);
}

async function seedMetaSnapshot() {
  console.log('📊 Seeding meta snapshot...');

  const metaSnapshot = {
    game: 'MW3',
    date: new Date().toISOString(),
    tiers: {
      S: [
        { id: 'ram7-id', name: 'RAM-7', category: 'AR', usage: 87, winRate: 54 },
        { id: 'jackal-id', name: 'Jackal PDW', category: 'SMG', usage: 91, winRate: 56 }
      ],
      A: [
        { id: 'mcw-id', name: 'MCW', category: 'AR', usage: 72, winRate: 52 }
      ],
      B: [],
      C: [],
      D: []
    },
    topLoadouts: [
      {
        id: 'meta-loadout-1',
        name: 'RAM-7 Aggressive',
        weapon: 'RAM-7',
        popularity: 85,
        winRate: 54
      }
    ],
    recentChanges: [
      'RAM-7 moved to S-tier after damage buff',
      'Jackal PDW maintains S-tier position',
      'MCW slightly nerfed but remains viable'
    ]
  };

  await db().collection('meta_snapshots').add(metaSnapshot);
  console.log('✅ Seeded meta snapshot');
}

async function main() {
  try {
    console.log('🚀 Starting database seeding...');

    // Initialize Firebase
    initializeFirebase();

    // Seed all data
    await seedWeapons();
    await seedAttachments();
    await seedPerks();
    await seedEquipment();
    await seedMetaSnapshot();

    console.log('🎉 Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

main();