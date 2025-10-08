/**
 * Example: Data Source Orchestrator Usage
 *
 * Demonstrates how to use the orchestrator to fetch data from multiple sources
 * with health monitoring, metrics tracking, and error handling.
 */

import { orchestrator, sourceCoordinator } from './lib/orchestrator';

async function main() {
  console.log('='.repeat(80));
  console.log('DATA SOURCE ORCHESTRATOR - EXAMPLE USAGE');
  console.log('='.repeat(80));
  console.log();

  // Example 1: Basic Usage - Fetch from all sources
  console.log('Example 1: Fetching from all enabled sources...\n');

  const data = await orchestrator.fetchFromAllSources();

  console.log('\nResults:');
  console.log(`  Success: ${data.metadata.successCount}/${data.metadata.successCount + data.metadata.failureCount}`);
  console.log(`  Duration: ${data.metadata.totalDuration}ms`);
  console.log(`  Sources: ${data.metadata.sources.join(', ')}`);
  console.log();

  // Show what data we got from each source
  if (data.codarmory) {
    console.log('  ✓ CODArmory:');
    console.log(`    - Weapons: ${data.codarmory.weapons?.length || 0}`);
    console.log(`    - Attachments: ${data.codarmory.attachments?.length || 0}`);
  }

  if (data.wzstats) {
    console.log('  ✓ WZStats:');
    console.log(`    - Meta entries: ${data.wzstats.length || 0}`);
  }

  if (data.codmunity) {
    console.log('  ✓ CODMunity:');
    console.log(`    - Stat entries: ${data.codmunity.length || 0}`);
  }

  console.log('\n' + '-'.repeat(80) + '\n');

  // Example 2: Health Monitoring
  console.log('Example 2: Checking source health...\n');

  const healthReports = await orchestrator.checkSourceHealth();

  healthReports.forEach(report => {
    const statusEmoji =
      report.status === 'healthy' ? '✅' :
      report.status === 'degraded' ? '⚠️' :
      report.status === 'down' ? '❌' : '❓';

    console.log(`${statusEmoji} ${report.sourceName}:`);
    console.log(`    Status: ${report.status}`);
    console.log(`    Uptime: ${report.uptime.toFixed(1)}%`);
    console.log(`    Avg Latency: ${Math.round(report.averageLatency)}ms`);
    console.log(`    Consecutive Failures: ${report.consecutiveFailures}`);

    if (report.lastSuccessfulFetch) {
      const ago = Math.round((Date.now() - report.lastSuccessfulFetch) / 1000);
      console.log(`    Last Success: ${ago}s ago`);
    }

    console.log();
  });

  // Overall health
  const overallHealth = orchestrator.getOverallHealth();
  console.log(`Overall System Health: ${overallHealth.status.toUpperCase()}`);
  console.log(`  Healthy: ${overallHealth.healthySources}/${overallHealth.totalSources}`);
  console.log(`  Degraded: ${overallHealth.degradedSources}/${overallHealth.totalSources}`);
  console.log(`  Down: ${overallHealth.downSources}/${overallHealth.totalSources}`);

  console.log('\n' + '-'.repeat(80) + '\n');

  // Example 3: Metrics Tracking
  console.log('Example 3: Orchestrator metrics...\n');

  const metrics = orchestrator.getMetrics();

  console.log('Orchestrator Performance:');
  console.log(`  Total Executions: ${metrics.totalExecutions}`);
  console.log(`  Successful: ${metrics.successfulExecutions} (${((metrics.successfulExecutions / metrics.totalExecutions) * 100).toFixed(1)}%)`);
  console.log(`  Failed: ${metrics.failedExecutions} (${((metrics.failedExecutions / metrics.totalExecutions) * 100).toFixed(1)}%)`);
  console.log(`  Average Duration: ${Math.round(metrics.averageDuration)}ms`);

  if (metrics.lastExecution) {
    const ago = Math.round((Date.now() - metrics.lastExecution) / 1000);
    console.log(`  Last Execution: ${ago}s ago`);
  }

  console.log('\nPer-Source Metrics:');
  Object.entries(metrics.sourceMetrics).forEach(([name, sourceMetrics]) => {
    const successRate = (sourceMetrics.successes / sourceMetrics.executions) * 100;
    console.log(`  ${name}:`);
    console.log(`    Executions: ${sourceMetrics.executions}`);
    console.log(`    Success Rate: ${successRate.toFixed(1)}%`);
    console.log(`    Avg Duration: ${Math.round(sourceMetrics.averageDuration)}ms`);
  });

  console.log('\n' + '-'.repeat(80) + '\n');

  // Example 4: Source Management
  console.log('Example 4: Source management...\n');

  const stats = sourceCoordinator.getStats();
  console.log('Source Registry:');
  console.log(`  Total Sources: ${stats.totalSources}`);
  console.log(`  Enabled: ${stats.enabledSources}`);
  console.log(`  Disabled: ${stats.disabledSources}`);
  console.log(`  Average Reliability: ${(stats.averageReliability * 100).toFixed(1)}%`);

  console.log('\nSources by Update Frequency:');
  Object.entries(stats.byUpdateFrequency).forEach(([freq, count]) => {
    console.log(`  ${freq}: ${count}`);
  });

  console.log('\nData Capabilities:');
  Object.entries(stats.byCapability).forEach(([capability, sources]) => {
    console.log(`  ${capability}: ${sources.join(', ')}`);
  });

  console.log('\n' + '-'.repeat(80) + '\n');

  // Example 5: Meta Data Only (Faster)
  console.log('Example 5: Fetching meta data only (faster)...\n');

  const startTime = Date.now();
  const metaData = await orchestrator.fetchMetaOnly();
  const metaDuration = Date.now() - startTime;

  console.log(`Meta data fetched in ${metaDuration}ms`);
  console.log(`Entries: ${metaData.length}`);

  if (metaData.length > 0) {
    console.log('\nSample entries:');
    metaData.slice(0, 3).forEach((entry: any) => {
      console.log(`  - ${entry.name || 'Unknown'} (${entry.tier || 'N/A'})`);
    });
  }

  console.log('\n' + '='.repeat(80));
  console.log('EXAMPLE COMPLETE');
  console.log('='.repeat(80));
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Error running orchestrator example:', error);
    process.exit(1);
  });
}

export { main };
