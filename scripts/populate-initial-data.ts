#!/usr/bin/env tsx

import 'dotenv/config';
import { initializeFirebase, db } from '../server/src/firebase/admin';
import { fetchAllCODArmoryData, testCODArmoryConnection } from './lib/scrapers/codarmory-fetcher';
import {
  transformCODArmoryWeapon,
  transformCODArmoryAttachment,
} from './lib/transformers/codarmory-transformer';
import { cache } from './lib/utils/cache';

/**
 * Populate initial weapon and attachment data from CODArmory
 */
async function populateWeapons() {
  console.log('🔫 Populating weapons...');

  const { weapons } = await fetchAllCODArmoryData();

  let successCount = 0;
  let errorCount = 0;

  for (const weaponData of weapons) {
    try {
      const weapon = transformCODArmoryWeapon(weaponData);

      // Create weapon document
      const ref = db().collection('weapons').doc();
      await ref.set({
        ...weapon,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        dataSource: 'codarmory',
        dataVersion: '1.0.0',
      });

      successCount++;
      console.log(`  ✅ Added: ${weapon.name} (${weapon.game} ${weapon.category})`);
    } catch (error) {
      errorCount++;
      console.error(`  ❌ Failed to add weapon:`, error);
    }
  }

  console.log(`\n📊 Weapons Summary:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);

  return { successCount, errorCount };
}

/**
 * Populate attachment data
 */
async function populateAttachments() {
  console.log('\n🔧 Populating attachments...');

  const { attachments } = await fetchAllCODArmoryData();

  let successCount = 0;
  let errorCount = 0;

  for (const attachmentData of attachments) {
    try {
      const attachment = transformCODArmoryAttachment(attachmentData);

      // Create attachment document
      const ref = db().collection('attachments').doc();
      await ref.set({
        ...attachment,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        dataSource: 'codarmory',
      });

      successCount++;
      console.log(`  ✅ Added: ${attachment.name} (${attachment.slot})`);
    } catch (error) {
      errorCount++;
      console.error(`  ❌ Failed to add attachment:`, error);
    }
  }

  console.log(`\n📊 Attachments Summary:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);

  return { successCount, errorCount };
}

/**
 * Create initial meta snapshot
 */
async function createInitialMetaSnapshot() {
  console.log('\n📸 Creating initial meta snapshot...');

  try {
    // Get all weapons to organize by tier
    const weaponsSnapshot = await db().collection('weapons').get();

    const tierMap = {
      S: [] as any[],
      A: [] as any[],
      B: [] as any[],
      C: [] as any[],
      D: [] as any[],
    };

    weaponsSnapshot.forEach((doc) => {
      const weapon = doc.data();
      const tier = weapon.meta?.tier || 'C';

      tierMap[tier as keyof typeof tierMap].push({
        id: doc.id,
        name: weapon.name,
        category: weapon.category,
        usage: weapon.meta?.popularity || 0,
        winRate: weapon.meta?.winRate || 50,
      });
    });

    // Create meta snapshot
    const metaSnapshot = {
      game: 'MW3',
      date: new Date().toISOString(),
      tiers: tierMap,
      topLoadouts: [],
      recentChanges: [
        'Initial database population from CODArmory',
        'Meta rankings will be updated with real data soon',
      ],
      dataSource: 'initial-population',
    };

    await db().collection('meta_snapshots').add(metaSnapshot);
    console.log('✅ Created initial meta snapshot');
  } catch (error) {
    console.error('❌ Failed to create meta snapshot:', error);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting initial data population...\n');
  console.log('📍 Data Source: CODArmory GitHub Repository');
  console.log('📍 Repository: https://github.com/tzurbaev/codarmory.com\n');

  try {
    // Initialize cache
    await cache.init();

    // Test connection
    const connected = await testCODArmoryConnection();
    if (!connected) {
      throw new Error('Cannot connect to CODArmory repository');
    }

    // Initialize Firebase
    console.log('\n🔥 Initializing Firebase...');
    initializeFirebase();

    // Populate data
    const weaponStats = await populateWeapons();
    const attachmentStats = await populateAttachments();

    // Create meta snapshot
    await createInitialMetaSnapshot();

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 Data Population Complete!');
    console.log('='.repeat(60));
    console.log(`\n📊 Total Results:`);
    console.log(`   🔫 Weapons: ${weaponStats.successCount} added, ${weaponStats.errorCount} failed`);
    console.log(`   🔧 Attachments: ${attachmentStats.successCount} added, ${attachmentStats.errorCount} failed`);

    // Cache stats
    const cacheStats = await cache.stats();
    console.log(`\n💾 Cache Statistics:`);
    console.log(`   📁 Files: ${cacheStats.files}`);
    console.log(`   💿 Size: ${(cacheStats.size / 1024).toFixed(2)} KB`);

    console.log('\n💡 Next Steps:');
    console.log('   1. Run "npm run update:meta" to fetch live meta data');
    console.log('   2. Check Firestore console to verify data');
    console.log('   3. Upload weapon images to Firebase Storage\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Fatal Error:', error);
    console.error('\n📝 Error Details:');

    if (error instanceof Error) {
      console.error(`   Message: ${error.message}`);
      console.error(`   Stack: ${error.stack}`);
    }

    process.exit(1);
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Rejection:', error);
  process.exit(1);
});

main();
