#!/usr/bin/env tsx

import 'dotenv/config';
import crypto from 'crypto';
import { initializeFirebase, db } from '../server/src/firebase/admin';

/**
 * Generate deterministic ID from weapon name and game
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
 * Find and remove duplicate weapons, keeping the most recent one
 */
async function cleanupDuplicateWeapons() {
  console.log('🔍 Finding duplicate weapons...');

  const weaponsSnapshot = await db().collection('weapons').get();
  const weapons = weaponsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as any[];

  // Group by name + game
  const weaponGroups = new Map<string, any[]>();

  for (const weapon of weapons) {
    const key = `${weapon.name}-${weapon.game}`.toLowerCase();
    if (!weaponGroups.has(key)) {
      weaponGroups.set(key, []);
    }
    weaponGroups.get(key)!.push(weapon);
  }

  let duplicateGroups = 0;
  let deletedCount = 0;
  let migratedCount = 0;

  for (const [key, group] of weaponGroups.entries()) {
    if (group.length > 1) {
      duplicateGroups++;
      console.log(`\n  ⚠️  Found ${group.length} duplicates for: ${group[0].name} (${group[0].game})`);

      // Sort by updatedAt (most recent first)
      group.sort((a, b) =>
        new Date(b.updatedAt || b.createdAt).getTime() -
        new Date(a.updatedAt || a.createdAt).getTime()
      );

      const mostRecent = group[0];
      const canonicalName = mostRecent.name;
      const canonicalGame = mostRecent.game;
      const canonicalId = generateWeaponId(canonicalName, canonicalGame);

      // Merge data into canonical document
      const canonicalRef = db().collection('weapons').doc(canonicalId);
      const canonicalDoc = await canonicalRef.get();

      if (!canonicalDoc.exists) {
        // Create canonical document with most recent data
        await canonicalRef.set({
          ...mostRecent,
          updatedAt: new Date().toISOString(),
        });
        migratedCount++;
        console.log(`    ✅ Created canonical: ${canonicalId.substring(0, 8)}`);
      } else {
        // Update canonical with most recent data
        await canonicalRef.update({
          ...mostRecent,
          updatedAt: new Date().toISOString(),
        });
        migratedCount++;
        console.log(`    🔄 Updated canonical: ${canonicalId.substring(0, 8)}`);
      }

      // Delete all duplicates (including the one we copied from if it has different ID)
      for (const duplicate of group) {
        if (duplicate.id !== canonicalId) {
          await db().collection('weapons').doc(duplicate.id).delete();
          deletedCount++;
          console.log(`    🗑️  Deleted duplicate: ${duplicate.id.substring(0, 8)}`);
        }
      }
    }
  }

  console.log(`\n📊 Weapons Cleanup Summary:`);
  console.log(`   🔍 Groups with duplicates: ${duplicateGroups}`);
  console.log(`   ✅ Migrated to canonical IDs: ${migratedCount}`);
  console.log(`   🗑️  Deleted duplicates: ${deletedCount}`);

  return { duplicateGroups, migratedCount, deletedCount };
}

/**
 * Find and remove duplicate attachments, keeping the most recent one
 */
async function cleanupDuplicateAttachments() {
  console.log('\n🔍 Finding duplicate attachments...');

  const attachmentsSnapshot = await db().collection('attachments').get();
  const attachments = attachmentsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as any[];

  // Group by name + slot
  const attachmentGroups = new Map<string, any[]>();

  for (const attachment of attachments) {
    const key = `${attachment.name}-${attachment.slot}`.toLowerCase();
    if (!attachmentGroups.has(key)) {
      attachmentGroups.set(key, []);
    }
    attachmentGroups.get(key)!.push(attachment);
  }

  let duplicateGroups = 0;
  let deletedCount = 0;
  let migratedCount = 0;

  for (const [key, group] of attachmentGroups.entries()) {
    if (group.length > 1) {
      duplicateGroups++;
      console.log(`\n  ⚠️  Found ${group.length} duplicates for: ${group[0].name} (${group[0].slot})`);

      // Sort by updatedAt (most recent first)
      group.sort((a, b) =>
        new Date(b.updatedAt || b.createdAt).getTime() -
        new Date(a.updatedAt || a.createdAt).getTime()
      );

      const mostRecent = group[0];
      const canonicalName = mostRecent.name;
      const canonicalSlot = mostRecent.slot;
      const canonicalId = generateAttachmentId(canonicalName, canonicalSlot);

      // Merge data into canonical document
      const canonicalRef = db().collection('attachments').doc(canonicalId);
      const canonicalDoc = await canonicalRef.get();

      if (!canonicalDoc.exists) {
        // Create canonical document with most recent data
        await canonicalRef.set({
          ...mostRecent,
          updatedAt: new Date().toISOString(),
        });
        migratedCount++;
        console.log(`    ✅ Created canonical: ${canonicalId.substring(0, 8)}`);
      } else {
        // Update canonical with most recent data
        await canonicalRef.update({
          ...mostRecent,
          updatedAt: new Date().toISOString(),
        });
        migratedCount++;
        console.log(`    🔄 Updated canonical: ${canonicalId.substring(0, 8)}`);
      }

      // Delete all duplicates
      for (const duplicate of group) {
        if (duplicate.id !== canonicalId) {
          await db().collection('attachments').doc(duplicate.id).delete();
          deletedCount++;
          console.log(`    🗑️  Deleted duplicate: ${duplicate.id.substring(0, 8)}`);
        }
      }
    }
  }

  console.log(`\n📊 Attachments Cleanup Summary:`);
  console.log(`   🔍 Groups with duplicates: ${duplicateGroups}`);
  console.log(`   ✅ Migrated to canonical IDs: ${migratedCount}`);
  console.log(`   🗑️  Deleted duplicates: ${deletedCount}`);

  return { duplicateGroups, migratedCount, deletedCount };
}

/**
 * Main execution
 */
async function main() {
  console.log('🧹 Starting duplicate cleanup...\n');

  try {
    // Initialize Firebase
    initializeFirebase();

    // Clean up weapons
    const weaponStats = await cleanupDuplicateWeapons();

    // Clean up attachments
    const attachmentStats = await cleanupDuplicateAttachments();

    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 Cleanup Complete!');
    console.log('='.repeat(60));
    console.log(`\n📊 Total Results:`);
    console.log(`   🔫 Weapons: ${weaponStats.migratedCount} migrated, ${weaponStats.deletedCount} deleted`);
    console.log(`   🔧 Attachments: ${attachmentStats.migratedCount} migrated, ${attachmentStats.deletedCount} deleted`);

    console.log('\n💡 Next Steps:');
    console.log('   1. Run "npm run data:sync" to re-sync with CODArmory');
    console.log('   2. All future syncs will use canonical IDs (no more duplicates)\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Fatal Error:', error);
    if (error instanceof Error) {
      console.error(`   Message: ${error.message}`);
      console.error(`   Stack: ${error.stack}`);
    }
    process.exit(1);
  }
}

main();
