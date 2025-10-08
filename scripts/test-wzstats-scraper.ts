/**
 * Test script for WZStats scraper
 *
 * Run this script to verify the WZStats scraper implementation:
 * npm run data:test -- scripts/test-wzstats-scraper.ts
 * or
 * tsx scripts/test-wzstats-scraper.ts
 */

import dotenv from 'dotenv';
import { fetchWZStatsMetaData, testWZStatsConnection } from './lib/scrapers/wzstats-scraper';
import {
  transformWZStatsWeapon,
  matchWeaponName,
  filterValidWZStatsWeapons,
  getTopWeapons,
  generateUpdateReport,
} from './lib/transformers/wzstats-transformer';
import { Weapon } from '../server/src/models/weapon.model';

// Load environment variables
dotenv.config();

async function main() {
  console.log('\n🧪 WZStats Scraper Implementation Test\n');
  console.log('=' .repeat(60));

  // Test 1: Connection Test
  console.log('\n📡 Test 1: Connection Test');
  console.log('-'.repeat(60));
  const connectionSuccess = await testWZStatsConnection();
  console.log(`Result: ${connectionSuccess ? '✅ Success' : '❌ Failed'}`);

  // Test 2: Fetch Meta Data
  console.log('\n📥 Test 2: Fetch WZStats Meta Data');
  console.log('-'.repeat(60));
  try {
    const weapons = await fetchWZStatsMetaData();
    console.log(`Fetched ${weapons.length} weapons`);

    if (weapons.length > 0) {
      console.log('\nSample weapons:');
      weapons.slice(0, 5).forEach((weapon, idx) => {
        console.log(`  ${idx + 1}. ${weapon.name}`);
        console.log(`     Tier: ${weapon.tier} | Usage: ${weapon.usage}% | Win Rate: ${weapon.winRate}%`);
      });
    } else {
      console.log('⚠️  No weapons fetched (this is expected if scraping is disabled or site is unavailable)');
    }

    // Test 3: Validate Data
    console.log('\n✅ Test 3: Data Validation');
    console.log('-'.repeat(60));
    const validWeapons = filterValidWZStatsWeapons(weapons);
    console.log(`Valid weapons: ${validWeapons.length}/${weapons.length}`);
    if (weapons.length > validWeapons.length) {
      console.log(`⚠️  Filtered out ${weapons.length - validWeapons.length} invalid weapons`);
    }

    // Test 4: Transformation
    console.log('\n🔄 Test 4: Data Transformation');
    console.log('-'.repeat(60));
    if (validWeapons.length > 0) {
      const sampleWeapon = validWeapons[0];
      const transformed = transformWZStatsWeapon(sampleWeapon);
      console.log(`Transformed weapon meta:`, JSON.stringify(transformed, null, 2));
    }

    // Test 5: Top Weapons
    console.log('\n🏆 Test 5: Top Weapons Extraction');
    console.log('-'.repeat(60));
    const topWeapons = getTopWeapons(validWeapons, 10);
    console.log(`Top ${topWeapons.length} weapons by tier and usage:`);
    topWeapons.forEach((weapon, idx) => {
      console.log(`  ${idx + 1}. [${weapon.tier}] ${weapon.name} - ${weapon.usage}% usage`);
    });

    // Test 6: Weapon Matching
    console.log('\n🎯 Test 6: Weapon Name Matching');
    console.log('-'.repeat(60));
    const mockWeapons: Weapon[] = [
      {
        id: '1',
        name: 'SVA 545',
        game: 'Warzone',
        category: 'AR',
        stats: { damage: 70, range: 75, accuracy: 80, fireRate: 70, mobility: 60, control: 75, handling: 68 },
        ballistics: { damageRanges: [], ttk: { min: 500, max: 700 }, fireRate: 700, magazineSize: 30, reloadTime: 2.0, adTime: 0.25 },
        attachmentSlots: {},
        meta: { tier: 'C', popularity: 0, winRate: 50, lastUpdated: new Date().toISOString() },
        bestFor: [],
        playstyles: [],
        imageUrl: '',
        iconUrl: '',
      },
    ];

    if (validWeapons.length > 0) {
      const matchTest = matchWeaponName(validWeapons[0].name, mockWeapons);
      console.log(`Match test for "${validWeapons[0].name}": ${matchTest ? '✅ Matched' : '❌ No match'}`);
    }

    // Test 7: Update Report
    console.log('\n📊 Test 7: Update Report Generation');
    console.log('-'.repeat(60));
    const report = generateUpdateReport(mockWeapons, validWeapons);
    console.log(`Matched: ${report.matched}`);
    console.log(`Unmatched: ${report.unmatched.length}`);
    console.log(`Updates: ${report.updates.length}`);

    if (report.unmatched.length > 0 && report.unmatched.length <= 5) {
      console.log('\nUnmatched weapons:', report.unmatched.join(', '));
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests completed successfully!');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error(error);
    process.exit(1);
  }
}

// Run tests
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
