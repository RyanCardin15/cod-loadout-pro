#!/usr/bin/env tsx

import 'dotenv/config';
import { testCODArmoryConnection } from './lib/scrapers/codarmory-fetcher';
import { cache } from './lib/utils/cache';
import { initializeFirebase, db } from '../server/src/firebase/admin';

/**
 * Health check for all data infrastructure components
 */

interface HealthStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  latency?: number;
  error?: string;
  details?: Record<string, any>;
}

/**
 * Check CODArmory GitHub connection
 */
async function checkCODArmory(): Promise<HealthStatus> {
  const startTime = Date.now();

  try {
    const connected = await testCODArmoryConnection();
    const latency = Date.now() - startTime;

    return {
      name: 'CODArmory (GitHub)',
      status: connected ? 'healthy' : 'down',
      latency,
      details: {
        repository: 'https://github.com/tzurbaev/codarmory.com',
      },
    };
  } catch (error) {
    return {
      name: 'CODArmory (GitHub)',
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check WZStats.gg connection
 */
async function checkWZStats(): Promise<HealthStatus> {
  const startTime = Date.now();

  try {
    const response = await fetch('https://wzstats.gg', {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CounterplayBot/1.0)',
      },
    });

    const latency = Date.now() - startTime;

    return {
      name: 'WZStats.gg',
      status: response.ok ? 'degraded' : 'down',
      latency,
      details: {
        httpStatus: response.status,
        note: 'Scraper not yet implemented',
      },
    };
  } catch (error) {
    return {
      name: 'WZStats.gg',
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check CODMunity connection
 */
async function checkCODMunity(): Promise<HealthStatus> {
  const startTime = Date.now();

  try {
    const response = await fetch('https://codmunity.gg', {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CounterplayBot/1.0)',
      },
    });

    const latency = Date.now() - startTime;

    return {
      name: 'CODMunity',
      status: response.ok ? 'degraded' : 'down',
      latency,
      details: {
        httpStatus: response.status,
        note: 'Scraper not yet implemented',
      },
    };
  } catch (error) {
    return {
      name: 'CODMunity',
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check Firestore connection
 */
async function checkFirestore(): Promise<HealthStatus> {
  const startTime = Date.now();

  try {
    // Try to read from weapons collection
    const snapshot = await db().collection('weapons').limit(1).get();
    const latency = Date.now() - startTime;

    // Get collection counts
    const weaponsCount = (await db().collection('weapons').count().get()).data().count;
    const attachmentsCount = (await db().collection('attachments').count().get()).data().count;
    const loadoutsCount = (await db().collection('loadouts').count().get()).data().count;
    const metaSnapshotsCount = (await db().collection('meta_snapshots').count().get()).data().count;

    return {
      name: 'Firestore',
      status: 'healthy',
      latency,
      details: {
        weapons: weaponsCount,
        attachments: attachmentsCount,
        loadouts: loadoutsCount,
        metaSnapshots: metaSnapshotsCount,
      },
    };
  } catch (error) {
    return {
      name: 'Firestore',
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check cache system
 */
async function checkCache(): Promise<HealthStatus> {
  const startTime = Date.now();

  try {
    await cache.init();
    const stats = await cache.stats();
    const latency = Date.now() - startTime;

    return {
      name: 'File Cache',
      status: 'healthy',
      latency,
      details: {
        files: stats.files,
        sizeKB: (stats.size / 1024).toFixed(2),
      },
    };
  } catch (error) {
    return {
      name: 'File Cache',
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check data freshness
 */
async function checkDataFreshness(): Promise<HealthStatus> {
  try {
    // Get most recent weapon update
    const weaponsSnapshot = await db()
      .collection('weapons')
      .orderBy('updatedAt', 'desc')
      .limit(1)
      .get();

    if (weaponsSnapshot.empty) {
      return {
        name: 'Data Freshness',
        status: 'down',
        error: 'No weapons found in database',
      };
    }

    const lastUpdate = weaponsSnapshot.docs[0].data().updatedAt;
    const lastUpdateDate = new Date(lastUpdate);
    const hoursSinceUpdate = (Date.now() - lastUpdateDate.getTime()) / (1000 * 60 * 60);

    // Determine status based on age
    let status: 'healthy' | 'degraded' | 'down' = 'healthy';
    if (hoursSinceUpdate > 168) { // 1 week
      status = 'down';
    } else if (hoursSinceUpdate > 48) { // 2 days
      status = 'degraded';
    }

    return {
      name: 'Data Freshness',
      status,
      details: {
        lastUpdate: lastUpdateDate.toISOString(),
        hoursSinceUpdate: hoursSinceUpdate.toFixed(1),
        recommendation: hoursSinceUpdate > 168 ? 'Run npm run data:sync immediately' :
                       hoursSinceUpdate > 48 ? 'Consider running npm run data:update' :
                       'Data is fresh',
      },
    };
  } catch (error) {
    return {
      name: 'Data Freshness',
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Main health check
 */
async function main() {
  console.log('🏥 Data Infrastructure Health Check\n');
  console.log('='.repeat(60));
  console.log('\n');

  try {
    // Initialize Firebase
    initializeFirebase();

    // Run all health checks in parallel
    const [
      codarmoryStatus,
      wzstatsStatus,
      codmunityStatus,
      firestoreStatus,
      cacheStatus,
      freshnessStatus,
    ] = await Promise.all([
      checkCODArmory(),
      checkWZStats(),
      checkCODMunity(),
      checkFirestore(),
      checkCache(),
      checkDataFreshness(),
    ]);

    const allStatuses = [
      codarmoryStatus,
      wzstatsStatus,
      codmunityStatus,
      firestoreStatus,
      cacheStatus,
      freshnessStatus,
    ];

    // Print results
    for (const status of allStatuses) {
      const emoji = status.status === 'healthy' ? '✅' :
                   status.status === 'degraded' ? '⚠️' : '❌';

      console.log(`${emoji} ${status.name.padEnd(25)} ${status.status.toUpperCase()}`);

      if (status.latency) {
        console.log(`   ⏱️  Latency: ${status.latency}ms`);
      }

      if (status.error) {
        console.log(`   ❌ Error: ${status.error}`);
      }

      if (status.details) {
        for (const [key, value] of Object.entries(status.details)) {
          console.log(`   📊 ${key}: ${value}`);
        }
      }

      console.log('');
    }

    // Overall system status
    const healthyCount = allStatuses.filter(s => s.status === 'healthy').length;
    const degradedCount = allStatuses.filter(s => s.status === 'degraded').length;
    const downCount = allStatuses.filter(s => s.status === 'down').length;

    console.log('='.repeat(60));
    console.log('\n📊 Overall System Status:\n');
    console.log(`   ✅ Healthy:  ${healthyCount}/${allStatuses.length}`);
    console.log(`   ⚠️  Degraded: ${degradedCount}/${allStatuses.length}`);
    console.log(`   ❌ Down:     ${downCount}/${allStatuses.length}`);

    // System health score
    const healthScore = (healthyCount * 100 + degradedCount * 50) / allStatuses.length;
    console.log(`\n   🎯 Health Score: ${healthScore.toFixed(0)}%`);

    // Recommendations
    console.log('\n💡 Recommendations:\n');

    if (codarmoryStatus.status !== 'healthy') {
      console.log('   ⚠️  CODArmory is down - check GitHub API status');
    }

    if (wzstatsStatus.status === 'degraded') {
      console.log('   ⚠️  WZStats.gg scraper needs implementation');
    }

    if (codmunityStatus.status === 'degraded') {
      console.log('   ⚠️  CODMunity scraper needs implementation');
    }

    if (freshnessStatus.status !== 'healthy') {
      console.log(`   ⚠️  ${freshnessStatus.details?.recommendation}`);
    }

    if (firestoreStatus.status === 'down') {
      console.log('   ❌ Firestore is down - check Firebase credentials and project status');
    }

    if (healthScore === 100) {
      console.log('   ✅ All systems operational!');
    }

    console.log('\n');

    // Exit code based on critical systems
    const criticalSystemsDown = [codarmoryStatus, firestoreStatus].some(s => s.status === 'down');
    process.exit(criticalSystemsDown ? 1 : 0);

  } catch (error) {
    console.error('❌ Health check failed:', error);
    process.exit(1);
  }
}

main();
