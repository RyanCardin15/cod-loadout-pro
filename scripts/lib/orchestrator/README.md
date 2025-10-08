# Data Source Orchestrator

Production-grade orchestration system for coordinating data fetching from multiple sources (CODArmory, WZStats, CODMunity) with parallel execution, retry logic, timeout handling, and comprehensive health monitoring.

## Features

- **Parallel Execution**: Fetch from multiple sources simultaneously for optimal performance
- **Retry Logic**: Exponential backoff with jitter for failed requests
- **Timeout Handling**: Individual and global timeouts to prevent hanging requests
- **Health Monitoring**: Track source reliability, uptime, and latency
- **Auto Management**: Automatically disable unhealthy sources and re-enable recovered ones
- **Comprehensive Metrics**: Track execution statistics for each source
- **Partial Failure Handling**: Continue execution even when some sources fail
- **Priority-Based Execution**: Sources execute in priority order when sequential

## Architecture

### Components

1. **DataSourceOrchestrator** - Main orchestrator class that coordinates execution
2. **SourceCoordinator** - Manages source registry, priorities, and health
3. **Type Definitions** - Complete TypeScript interfaces for all components

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    DataSourceOrchestrator                    │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Source Coordinator                         │ │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐       │ │
│  │  │ CODArmory  │  │  WZStats   │  │ CODMunity  │       │ │
│  │  │ Priority 1 │  │ Priority 2 │  │ Priority 3 │       │ │
│  │  │ Enabled    │  │ Enabled    │  │ Enabled    │       │ │
│  │  └────────────┘  └────────────┘  └────────────┘       │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─────────────────────┐   ┌─────────────────────┐         │
│  │  Parallel Execution │   │   Retry with        │         │
│  │  Promise.allSettled │   │   Exponential       │         │
│  │                     │   │   Backoff           │         │
│  └─────────────────────┘   └─────────────────────┘         │
│                                                               │
│  ┌─────────────────────┐   ┌─────────────────────┐         │
│  │  Health Monitoring  │   │   Metrics Tracking  │         │
│  │  Uptime, Latency    │   │   Success/Failure   │         │
│  └─────────────────────┘   └─────────────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

## Usage

### Basic Usage

```typescript
import { orchestrator } from './lib/orchestrator';

// Fetch from all enabled sources
const data = await orchestrator.fetchFromAllSources();

console.log(data.codarmory);   // CODArmory data
console.log(data.wzstats);     // WZStats data
console.log(data.codmunity);   // CODMunity data
console.log(data.metadata);    // Execution metadata
```

### Fetch Meta Data Only (Faster)

```typescript
// Fetch only tier/winRate/pickRate data
const metaData = await orchestrator.fetchMetaOnly();
```

### Health Monitoring

```typescript
// Check health of all sources
const healthReports = await orchestrator.checkSourceHealth();

healthReports.forEach(report => {
  console.log(`${report.sourceName}: ${report.status}`);
  console.log(`  Uptime: ${report.uptime}%`);
  console.log(`  Avg Latency: ${report.averageLatency}ms`);
  console.log(`  Failures: ${report.consecutiveFailures}`);
});

// Get overall system health
const overallHealth = orchestrator.getOverallHealth();
console.log(`System Status: ${overallHealth.status}`);
console.log(`Healthy Sources: ${overallHealth.healthySources}/${overallHealth.totalSources}`);
```

### Metrics Tracking

```typescript
// Get orchestrator metrics
const metrics = orchestrator.getMetrics();

console.log(`Total Executions: ${metrics.totalExecutions}`);
console.log(`Success Rate: ${(metrics.successfulExecutions / metrics.totalExecutions * 100).toFixed(1)}%`);
console.log(`Average Duration: ${metrics.averageDuration}ms`);

// Source-specific metrics
Object.entries(metrics.sourceMetrics).forEach(([name, sourceMetrics]) => {
  console.log(`\n${name}:`);
  console.log(`  Executions: ${sourceMetrics.executions}`);
  console.log(`  Success Rate: ${(sourceMetrics.successes / sourceMetrics.executions * 100).toFixed(1)}%`);
  console.log(`  Avg Duration: ${sourceMetrics.averageDuration}ms`);
});
```

### Source Management

```typescript
import { sourceCoordinator } from './lib/orchestrator';

// Disable a source
sourceCoordinator.disableSource('wzstats');

// Enable a source
sourceCoordinator.enableSource('wzstats');

// Update priority
sourceCoordinator.updatePriority('codmunity', 1);

// Get sources by capability
const metaSources = sourceCoordinator.getSourcesByCapability('tier');
```

### Custom Configuration

```typescript
import { DataSourceOrchestrator, SourceCoordinator } from './lib/orchestrator';

const coordinator = new SourceCoordinator();
const orchestrator = new DataSourceOrchestrator(
  coordinator,
  {
    timeout: 30000,           // 30 second global timeout
    maxRetries: 2,            // 2 retries per source
    parallelExecution: true,  // Parallel execution
    failFast: false,          // Continue on failures
    minSuccessfulSources: 1,  // Require at least 1 success
  },
  {
    maxRetries: 2,
    baseDelayMs: 1000,        // 1 second base delay
    maxDelayMs: 10000,        // 10 second max delay
    exponentialBackoff: true, // Use exponential backoff
    jitter: true,             // Add jitter to prevent thundering herd
  }
);
```

## Configuration

### Environment Variables

Add to `.env`:

```bash
# Total timeout for all sources (milliseconds)
DATA_ORCHESTRATOR_TIMEOUT_MS=60000

# Maximum retry attempts per source
DATA_ORCHESTRATOR_MAX_RETRIES=3

# Execute sources in parallel (true) or sequentially (false)
DATA_ORCHESTRATOR_PARALLEL_EXECUTION=true
```

### Source Configuration

Each source in the registry has:

```typescript
{
  name: 'CODArmory',
  priority: 1,              // Lower = higher priority
  provides: ['baseStats', 'attachments'],
  updateFrequency: 'weekly',
  reliability: 0.95,        // 0-1 score
  fetcher: fetchFunction,   // Async function that returns data
  enabled: true,
  timeout: 30000,           // Source-specific timeout (ms)
  maxRetries: 3,            // Source-specific retry count
}
```

## Data Sources

### CODArmory (Priority 1)
- **Provides**: Base stats, attachments, categories
- **Update Frequency**: Weekly
- **Reliability**: 95%
- **Source**: GitHub repository (JSON files)
- **Always Enabled**: Yes

### WZStats (Priority 2)
- **Provides**: Tier rankings, win rate, pick rate
- **Update Frequency**: Hourly
- **Reliability**: 90%
- **Source**: Website scraping/API
- **Configurable**: Via `WZSTATS_SCRAPER_ENABLED`

### CODMunity (Priority 3)
- **Provides**: TTK, damage ranges, recoil, bullet velocity
- **Update Frequency**: Daily
- **Reliability**: 92%
- **Source**: Website scraping/API
- **Configurable**: Via `CODMUNITY_SCRAPER_ENABLED`

## Health Status

Sources are automatically monitored and assigned health status:

- **Healthy**: No recent failures, normal latency
- **Degraded**: Some failures, increased latency
- **Down**: Multiple consecutive failures
- **Unknown**: No execution history

### Auto-Management

The orchestrator automatically:
- Disables sources with 5+ consecutive failures
- Re-enables sources that recover and become healthy
- Tracks uptime percentage over last 100 executions
- Monitors average latency over last 10 successful requests

## Error Handling

### Partial Failures

The orchestrator handles partial failures gracefully:

```typescript
const result = await orchestrator.fetchFromAllSources();

// Check success/failure counts
console.log(`Successful: ${result.metadata.successCount}`);
console.log(`Failed: ${result.metadata.failureCount}`);

// Data from successful sources is still available
if (result.codarmory) {
  // Use CODArmory data
}

if (result.wzstats) {
  // Use WZStats data
}
```

### Retry Logic

Failed requests are automatically retried with exponential backoff:

```
Attempt 1: Immediate
Attempt 2: Wait 1000ms (base delay)
Attempt 3: Wait 2000ms (exponential)
Attempt 4: Wait 4000ms (exponential)
```

Jitter is added to prevent thundering herd problems when multiple sources fail simultaneously.

### Timeout Handling

Two levels of timeouts:

1. **Source Timeout**: Individual timeout per source (default: 30s)
2. **Global Timeout**: Total timeout for all sources (default: 60s)

```typescript
// Source-specific timeout
registry.codarmory.timeout = 30000;

// Global timeout (affects all sources)
orchestrator = new DataSourceOrchestrator(coordinator, {
  timeout: 60000
});
```

## Testing

Comprehensive test suite included:

```bash
# Run orchestrator tests
npm test scripts/lib/orchestrator/__tests__/

# Test files:
# - orchestrator.test.ts: Main orchestrator tests
# - source-coordinator.test.ts: Source management tests
```

### Test Coverage

- ✅ Parallel execution
- ✅ Sequential execution
- ✅ Partial failures
- ✅ Timeout handling
- ✅ Retry logic with exponential backoff
- ✅ Health monitoring
- ✅ Metrics tracking
- ✅ Source enable/disable
- ✅ Priority management
- ✅ Edge cases (empty registry, all disabled, null data)

## Performance

### Parallel vs Sequential

**Parallel Execution** (recommended):
- All sources execute simultaneously
- Total duration ≈ slowest source
- Example: 3 sources × 300ms each = ~300ms total

**Sequential Execution**:
- Sources execute one after another
- Total duration = sum of all sources
- Example: 3 sources × 300ms each = ~900ms total

### Optimization Tips

1. **Enable parallel execution** for faster results
2. **Disable unused sources** to reduce overhead
3. **Adjust timeouts** based on source reliability
4. **Monitor metrics** to identify slow sources
5. **Use `fetchMetaOnly()`** when you only need tier data

## Integration Example

```typescript
// scripts/sync-weapons.ts
import { orchestrator } from './lib/orchestrator';

async function syncWeapons() {
  console.log('Starting weapon data sync...');

  // Fetch from all sources
  const data = await orchestrator.fetchFromAllSources();

  // Check if we got enough data
  if (data.metadata.successCount < 1) {
    console.error('Failed to fetch from any sources');
    return;
  }

  // Process CODArmory data (base stats)
  if (data.codarmory) {
    await processBaseStats(data.codarmory.weapons);
    await processAttachments(data.codarmory.attachments);
  }

  // Process WZStats data (meta/tiers)
  if (data.wzstats) {
    await processMetaData(data.wzstats);
  }

  // Process CODMunity data (ballistics)
  if (data.codmunity) {
    await processBallisticsData(data.codmunity);
  }

  // Log execution summary
  console.log(`\nSync complete:`);
  console.log(`  Sources: ${data.metadata.sources.join(', ')}`);
  console.log(`  Duration: ${data.metadata.totalDuration}ms`);
  console.log(`  Success: ${data.metadata.successCount}/${data.metadata.successCount + data.metadata.failureCount}`);

  // Get health status
  const health = orchestrator.getOverallHealth();
  console.log(`\nSystem Health: ${health.status}`);
}
```

## Troubleshooting

### All Sources Failing

1. Check network connectivity
2. Verify environment variables are set
3. Check if sources are enabled in registry
4. Review timeout settings (may be too short)

### Slow Performance

1. Enable parallel execution
2. Reduce source timeouts
3. Disable unreliable sources
4. Check source health reports for high latency

### High Failure Rate

1. Review source health reports
2. Increase retry count
3. Increase timeout values
4. Check source-specific scrapers for issues

## Future Enhancements

- [ ] Circuit breaker pattern for repeated failures
- [ ] Weighted random selection based on reliability scores
- [ ] Caching layer integration
- [ ] Rate limiting across all sources
- [ ] Webhook notifications for health changes
- [ ] Dashboard for real-time monitoring
- [ ] A/B testing different source configurations

## License

Part of the Counterplay project.
