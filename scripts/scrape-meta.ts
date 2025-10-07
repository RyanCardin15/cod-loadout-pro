#!/usr/bin/env tsx

import { initializeFirebase, db } from '../server/src/firebase/admin.js';

interface MetaUpdate {
  weaponId: string;
  tier: 'S' | 'A' | 'B' | 'C' | 'D';
  popularity: number;
  winRate: number;
  changes: string[];
}

/**
 * Mock meta scraping function
 * In a real implementation, this would scrape data from:
 * - WZRanked.com
 * - TrueGameData.com
 * - ProSettings.net
 * - Reddit r/CODWarzone
 */
async function scrapeMetaData(): Promise<MetaUpdate[]> {
  console.log('🕷️ Scraping meta data from various sources...');

  // Simulate API calls to meta tracking websites
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Mock data - in reality this would come from web scraping
  const metaUpdates: MetaUpdate[] = [
    {
      weaponId: 'ram7-id',
      tier: 'S',
      popularity: 89,
      winRate: 55,
      changes: ['Increased popularity by 2%', 'Win rate improved']
    },
    {
      weaponId: 'jackal-id',
      tier: 'S',
      popularity: 93,
      winRate: 57,
      changes: ['Remains dominant in close range', 'Usage increased']
    },
    {
      weaponId: 'mcw-id',
      tier: 'A',
      popularity: 70,
      winRate: 51,
      changes: ['Slight decrease in usage', 'Still viable option']
    }
  ];

  console.log(`✅ Scraped meta data for ${metaUpdates.length} weapons`);
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

  const allChanges = updates.flatMap(u => u.changes);

  const metaSnapshot = {
    game: 'MW3',
    date: new Date().toISOString(),
    tiers,
    topLoadouts: [], // Would calculate from loadout usage data
    recentChanges: allChanges
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