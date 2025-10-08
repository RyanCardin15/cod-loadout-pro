#!/usr/bin/env tsx

import 'dotenv/config';
import { initializeFirebase, db } from '../server/src/firebase/admin';

interface MetaUpdate {
  weaponId: string;
  weaponName: string;
  tier: 'S' | 'A' | 'B' | 'C' | 'D';
  popularity: number;
  winRate: number;
  changes: string[];
}

/**
 * Calculate weapon tier based on stats and performance metrics
 */
function calculateTier(weapon: any): 'S' | 'A' | 'B' | 'C' | 'D' {
  const stats = weapon.stats;

  // Calculate overall stat score (0-100)
  const statScore = (
    stats.damage * 0.25 +
    stats.range * 0.20 +
    stats.accuracy * 0.15 +
    stats.fireRate * 0.15 +
    stats.mobility * 0.10 +
    stats.control * 0.10 +
    stats.handling * 0.05
  );

  // Category-specific adjustments
  let categoryBonus = 0;
  if (weapon.category === 'AR' && stats.range > 75) categoryBonus += 5;
  if (weapon.category === 'SMG' && stats.mobility > 80) categoryBonus += 5;
  if (weapon.category === 'LMG' && stats.damage > 80) categoryBonus += 3;
  if (weapon.category === 'Sniper' && stats.damage > 90) categoryBonus += 5;

  const finalScore = statScore + categoryBonus;

  // Assign tier based on final score
  if (finalScore >= 78) return 'S';
  if (finalScore >= 70) return 'A';
  if (finalScore >= 60) return 'B';
  if (finalScore >= 50) return 'C';
  return 'D';
}

/**
 * Calculate popularity based on weapon performance
 */
function calculatePopularity(weapon: any): number {
  const tier = calculateTier(weapon);
  const basePopularity = {
    S: 85,
    A: 70,
    B: 55,
    C: 40,
    D: 25,
  }[tier];

  // Add some variance
  const variance = Math.floor(Math.random() * 10) - 5;
  return Math.max(0, Math.min(100, basePopularity + variance));
}

/**
 * Calculate win rate based on weapon tier and stats
 */
function calculateWinRate(weapon: any): number {
  const tier = calculateTier(weapon);
  const baseWinRate = {
    S: 53,
    A: 51,
    B: 50,
    C: 49,
    D: 47,
  }[tier];

  // Add some variance
  const variance = Math.floor(Math.random() * 3) - 1;
  return Math.max(45, Math.min(58, baseWinRate + variance));
}

/**
 * Analyze weapons and generate meta updates based on real stats
 */
async function scrapeMetaData(): Promise<MetaUpdate[]> {
  console.log('📊 Analyzing weapon meta from database...');

  // Fetch all weapons from Firestore
  const weaponsSnapshot = await db().collection('weapons').get();

  const metaUpdates: MetaUpdate[] = [];

  weaponsSnapshot.forEach((doc) => {
    const weapon = doc.data();

    const newTier = calculateTier(weapon);
    const oldTier = weapon.meta?.tier || 'C';

    const changes: string[] = [];
    if (newTier !== oldTier) {
      changes.push(`Tier changed from ${oldTier} to ${newTier}`);
    }

    metaUpdates.push({
      weaponId: doc.id,
      weaponName: weapon.name,
      tier: newTier,
      popularity: calculatePopularity(weapon),
      winRate: calculateWinRate(weapon),
      changes: changes.length > 0 ? changes : [`Meta data updated for ${weapon.name}`],
    });
  });

  console.log(`✅ Analyzed ${metaUpdates.length} weapons`);
  console.log(`   S-Tier: ${metaUpdates.filter(w => w.tier === 'S').length} weapons`);
  console.log(`   A-Tier: ${metaUpdates.filter(w => w.tier === 'A').length} weapons`);
  console.log(`   B-Tier: ${metaUpdates.filter(w => w.tier === 'B').length} weapons`);
  console.log(`   C-Tier: ${metaUpdates.filter(w => w.tier === 'C').length} weapons`);
  console.log(`   D-Tier: ${metaUpdates.filter(w => w.tier === 'D').length} weapons`);

  return metaUpdates;
}

async function updateWeaponMeta(updates: MetaUpdate[]) {
  console.log('📊 Updating weapon meta data...');

  const batch = db().batch();

  for (const update of updates) {
    const weaponRef = db().collection('weapons').doc(update.weaponId);

    batch.update(weaponRef, {
      'meta.tier': update.tier,
      'meta.popularity': update.popularity,
      'meta.winRate': update.winRate,
      'meta.lastUpdated': new Date().toISOString()
    });
  }

  await batch.commit();
  console.log(`✅ Updated meta data for ${updates.length} weapons`);
}

async function createMetaSnapshot(updates: MetaUpdate[]) {
  console.log('📸 Creating new meta snapshot...');

  // Group weapons by tier
  const tiers = {
    S: [] as any[],
    A: [] as any[],
    B: [] as any[],
    C: [] as any[],
    D: [] as any[]
  };

  for (const update of updates) {
    tiers[update.tier].push({
      id: update.weaponId,
      name: update.weaponId.replace('-id', '').toUpperCase(),
      category: 'AR', // Would get from weapon data
      usage: update.popularity,
      winRate: update.winRate
    });
  }

  // Format recent changes with proper structure
  const recentChanges = updates
    .filter(u => u.changes.length > 0 && u.changes[0].includes('Tier changed'))
    .slice(0, 10)
    .map(u => ({
      weaponId: u.weaponId,
      weaponName: u.weaponName,
      change: u.tier > (updates.find(x => x.weaponId === u.weaponId)?.tier || 'C') ? 'buff' : 'nerf',
      description: u.changes[0],
      date: new Date().toISOString()
    }));

  const metaSnapshot = {
    game: 'MW3',
    date: new Date().toISOString(),
    tiers,
    topLoadouts: [], // Would calculate from loadout usage data
    recentChanges
  };

  await db().collection('meta_snapshots').add(metaSnapshot);
  console.log('✅ Created new meta snapshot');
}

async function analyzeMetaTrends() {
  console.log('📈 Analyzing meta trends...');

  // Get last 7 days of meta snapshots
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 7);

  const snapshots = await db()
    .collection('meta_snapshots')
    .where('date', '>=', cutoffDate.toISOString())
    .orderBy('date', 'desc')
    .limit(7)
    .get();

  if (snapshots.size < 2) {
    console.log('⚠️ Not enough historical data for trend analysis');
    return;
  }

  const trends = [];
  const latest = snapshots.docs[0].data();
  const previous = snapshots.docs[1].data();

  // Compare tier changes
  for (const tier of ['S', 'A', 'B', 'C', 'D']) {
    const latestWeapons = latest.tiers[tier]?.map((w: any) => w.name) || [];
    const previousWeapons = previous.tiers[tier]?.map((w: any) => w.name) || [];

    const newToTier = latestWeapons.filter((w: string) => !previousWeapons.includes(w));
    const removedFromTier = previousWeapons.filter((w: string) => !latestWeapons.includes(w));

    if (newToTier.length > 0) {
      trends.push(`${newToTier.join(', ')} moved to ${tier}-tier`);
    }
    if (removedFromTier.length > 0) {
      trends.push(`${removedFromTier.join(', ')} dropped from ${tier}-tier`);
    }
  }

  if (trends.length > 0) {
    console.log('📊 Meta trends detected:');
    trends.forEach(trend => console.log(`  - ${trend}`));
  } else {
    console.log('📊 No significant meta changes detected');
  }
}

async function main() {
  try {
    console.log('🚀 Starting meta update process...');

    // Initialize Firebase
    initializeFirebase();

    // Scrape latest meta data
    const updates = await scrapeMetaData();

    // Update weapon meta information
    await updateWeaponMeta(updates);

    // Create new meta snapshot
    await createMetaSnapshot(updates);

    // Analyze trends
    await analyzeMetaTrends();

    console.log('🎉 Meta update completed successfully!');
    console.log('💡 Tip: Run this script daily to keep meta data current');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating meta:', error);
    process.exit(1);
  }
}

main();