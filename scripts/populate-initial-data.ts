#!/usr/bin/env tsx

import 'dotenv/config';
import crypto from 'crypto';
import { initializeFirebase, db } from '../server/src/firebase/admin';
import { fetchAllCODArmoryData, testCODArmoryConnection } from './lib/scrapers/codarmory-fetcher';
import {
  transformCODArmoryWeapon,
  transformCODArmoryAttachment,
} from './lib/transformers/codarmory-transformer';
import { cache } from './lib/utils/cache';
import { validateWeapon, validateAttachment, sanitizeWeaponName, normalizeGameName } from './lib/utils/data-validator';

/**
 * Generate deterministic ID from weapon name and game
 * This ensures we can upsert instead of creating duplicates
 */
function generateWeaponId(name: string, game: string): string {
  return crypto.createHash('md5')
    .update(`${name.toLowerCase()}-${game.toLowerCase()}`)
    .digest('hex');
}

/**
 * Generate deterministic ID from attachment name and slot
 */
function generateAttachmentId(name: string, slot: string): string {
  return crypto.createHash('md5')
    .update(`${name.toLowerCase()}-${slot.toLowerCase()}`)
    .digest('hex');
}

/**
 * Populate initial weapon and attachment data from CODArmory
 */
async function populateWeapons() {
  console.log('🔫 Populating weapons...');

  const { weapons } = await fetchAllCODArmoryData();

  let successCount = 0;
  let updateCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  for (const weaponData of weapons) {
    try {
      const weapon = transformCODArmoryWeapon(weaponData);

      // Sanitize and normalize data
      weapon.name = sanitizeWeaponName(weapon.name);
      weapon.game = normalizeGameName(weapon.game);

      // Validate weapon data
      const validation = validateWeapon(weapon);

      if (!validation.valid) {
        console.error(`  ⚠️  Skipping ${weapon.name}: ${validation.errors.join(', ')}`);
        skippedCount++;
        continue;
      }

      // Log warnings if any
      if (validation.warnings.length > 0) {
        console.warn(`  ⚠️  ${weapon.name}: ${validation.warnings.join(', ')}`);
      }

      // Generate deterministic ID
      const weaponId = generateWeaponId(weapon.name, weapon.game);
      const ref = db().collection('weapons').doc(weaponId);

      // Check if weapon exists
      const existing = await ref.get();
      const now = new Date().toISOString();

      if (existing.exists) {
        // Update existing weapon
        await ref.update({
          ...weapon,
          updatedAt: now,
          dataSource: 'codarmory',
          dataVersion: '1.0.0',
        });
        updateCount++;
        console.log(`  🔄 Updated: ${weapon.name} (${weapon.game} ${weapon.category})`);
      } else {
        // Create new weapon
        await ref.set({
          ...weapon,
          createdAt: now,
          updatedAt: now,
          dataSource: 'codarmory',
          dataVersion: '1.0.0',
        });
        successCount++;
        console.log(`  ✅ Added: ${weapon.name} (${weapon.game} ${weapon.category})`);
      }
    } catch (error) {
      errorCount++;
      console.error(`  ❌ Failed to process weapon:`, error);
    }
  }

  console.log(`\n📊 Weapons Summary:`);
  console.log(`   ✅ Created: ${successCount}`);
  console.log(`   🔄 Updated: ${updateCount}`);
  console.log(`   ⏭️  Skipped: ${skippedCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);

  return { successCount, updateCount, skippedCount, errorCount };
}

/**
 * Populate attachment data
 */
async function populateAttachments() {
  console.log('\n🔧 Populating attachments...');

  const { attachments } = await fetchAllCODArmoryData();

  let successCount = 0;
  let updateCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  for (const attachmentData of attachments) {
    try {
      const attachment = transformCODArmoryAttachment(attachmentData);

      // Sanitize name
      attachment.name = sanitizeWeaponName(attachment.name);

      // Validate attachment data
      const validation = validateAttachment(attachment);

      if (!validation.valid) {
        console.error(`  ⚠️  Skipping ${attachment.name}: ${validation.errors.join(', ')}`);
        skippedCount++;
        continue;
      }

      // Log warnings if any
      if (validation.warnings.length > 0 && Math.random() < 0.1) {
        // Only log 10% of warnings to avoid spam
        console.warn(`  ⚠️  ${attachment.name}: ${validation.warnings.join(', ')}`);
      }

      // Generate deterministic ID
      const attachmentId = generateAttachmentId(attachment.name, attachment.slot);
      const ref = db().collection('attachments').doc(attachmentId);

      // Check if attachment exists
      const existing = await ref.get();
      const now = new Date().toISOString();

      if (existing.exists) {
        // Update existing attachment
        await ref.update({
          ...attachment,
          updatedAt: now,
          dataSource: 'codarmory',
        });
        updateCount++;
        console.log(`  🔄 Updated: ${attachment.name} (${attachment.slot})`);
      } else {
        // Create new attachment
        await ref.set({
          ...attachment,
          createdAt: now,
          updatedAt: now,
          dataSource: 'codarmory',
        });
        successCount++;
        console.log(`  ✅ Added: ${attachment.name} (${attachment.slot})`);
      }
    } catch (error) {
      errorCount++;
      console.error(`  ❌ Failed to process attachment:`, error);
    }
  }

  console.log(`\n📊 Attachments Summary:`);
  console.log(`   ✅ Created: ${successCount}`);
  console.log(`   🔄 Updated: ${updateCount}`);
  console.log(`   ⏭️  Skipped: ${skippedCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);

  return { successCount, updateCount, skippedCount, errorCount };
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
    console.log(`   🔫 Weapons: ${weaponStats.successCount} created, ${weaponStats.updateCount} updated, ${weaponStats.skippedCount} skipped, ${weaponStats.errorCount} failed`);
    console.log(`   🔧 Attachments: ${attachmentStats.successCount} created, ${attachmentStats.updateCount} updated, ${attachmentStats.skippedCount} skipped, ${attachmentStats.errorCount} failed`);

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
