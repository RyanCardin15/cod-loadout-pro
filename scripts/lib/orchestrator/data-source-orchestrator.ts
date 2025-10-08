// ============================================================================
// Data Source Orchestrator
// ============================================================================
// Coordinates fetching from all data sources with parallel/sequential execution,
// retry logic with exponential backoff, timeout handling, comprehensive health
// monitoring, and automatic source management.
// ============================================================================

import type {
  DataSourceConfig,
  HealthStatus,
  MultiSourceData,
  OrchestratorConfig,
  OrchestratorMetrics,
  RetryConfig,
  SourceExecutionResult,
  SourceHealthReport,
} from './types';
import { SourceCoordinator } from './source-coordinator';

// ============================================================================
// Configuration
// ============================================================================

/**
 * Default orchestrator configuration
 */
const DEFAULT_CONFIG: OrchestratorConfig = {
  timeout: parseInt(process.env.DATA_ORCHESTRATOR_TIMEOUT_MS || '60000', 10),
  maxRetries: parseInt(process.env.DATA_ORCHESTRATOR_MAX_RETRIES || '3', 10),
  parallelExecution: process.env.DATA_ORCHESTRATOR_PARALLEL_EXECUTION !== 'false',
  failFast: false,
  minSuccessfulSources: 1,
};

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  exponentialBackoff: true,
  jitter: true,
};

// ============================================================================
// Data Source Orchestrator Class
// ============================================================================

/**
 * Data Source Orchestrator Class
 */
export class DataSourceOrchestrator {
  private coordinator: SourceCoordinator;
  private config: OrchestratorConfig;
  private retryConfig: RetryConfig;
  private metrics: OrchestratorMetrics;
  private executionHistory: SourceExecutionResult[] = [];
  private maxHistorySize = 100;

  constructor(
    coordinator?: SourceCoordinator,
    config?: Partial<OrchestratorConfig>,
    retryConfig?: Partial<RetryConfig>
  ) {
    this.coordinator = coordinator || new SourceCoordinator();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
    this.metrics = this.initializeMetrics();
  }

  /**
   * Initialize metrics
   */
  private initializeMetrics(): OrchestratorMetrics {
    return {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageDuration: 0,
      sourceMetrics: {},
    };
  }

  // ==========================================================================
  // Public API - Data Fetching
  // ==========================================================================

  /**
   * Fetch data from all enabled sources
   */
  async fetchFromAllSources(): Promise<MultiSourceData> {
    const startTime = Date.now();
    console.log('Starting data source orchestration...');

    const sources = this.coordinator.getEnabledSources();

    if (sources.length === 0) {
      console.warn('No enabled sources found');
      return this.createEmptyResult(startTime);
    }

    console.log(`Orchestrating ${sources.length} enabled sources...`);

    // Execute sources
    const results = this.config.parallelExecution
      ? await this.executeParallel(sources)
      : await this.executeSequential(sources);

    // Aggregate results
    const aggregatedData = this.aggregateResults(results, startTime);

    // Update metrics
    this.updateMetrics(results, Date.now() - startTime);

    // Update source health
    this.updateSourceHealth(results);

    // Auto-manage source health
    this.autoManageSources();

    const duration = Date.now() - startTime;
    console.log(
      `Orchestration complete in ${duration}ms - ${aggregatedData.metadata.successCount}/${sources.length} sources succeeded`
    );

    return aggregatedData;
  }

  /**
   * Fetch only meta/tier data (faster subset)
   */
  async fetchMetaOnly(): Promise<any[]> {
    console.log('Fetching meta data only...');

    const sources = this.coordinator
      .getEnabledSources()
      .filter((source) =>
        source.provides.some((cap) => ['tier', 'winRate', 'pickRate'].includes(cap))
      );

    if (sources.length === 0) {
      console.warn('No meta data sources available');
      return [];
    }

    const results = await this.executeParallel(sources);
    const metaData: any[] = [];

    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value.status === 'success') {
        const data = result.value.data;
        if (Array.isArray(data)) {
          metaData.push(...data);
        }
      }
    });

    return metaData;
  }

  // ==========================================================================
  // Source Execution Strategies
  // ==========================================================================

  /**
   * Execute sources in parallel
   */
  private async executeParallel(
    sources: DataSourceConfig[]
  ): Promise<PromiseSettledResult<SourceExecutionResult>[]> {
    const promises = sources.map((source) =>
      this.executeWithTimeout(source, source.timeout || this.config.timeout)
    );

    return Promise.allSettled(promises);
  }

  /**
   * Execute sources sequentially
   */
  private async executeSequential(
    sources: DataSourceConfig[]
  ): Promise<PromiseSettledResult<SourceExecutionResult>[]> {
    const results: PromiseSettledResult<SourceExecutionResult>[] = [];

    for (const source of sources) {
      try {
        const result = await this.executeWithTimeout(
          source,
          source.timeout || this.config.timeout
        );
        results.push({ status: 'fulfilled', value: result });

        // Check fail-fast
        if (this.config.failFast && result.status === 'failure') {
          console.log('Fail-fast enabled, stopping execution');
          break;
        }
      } catch (error) {
        results.push({
          status: 'rejected',
          reason: error,
        });

        if (this.config.failFast) {
          console.log('Fail-fast enabled, stopping execution');
          break;
        }
      }
    }

    return results;
  }

  /**
   * Execute a source with timeout
   */
  private async executeWithTimeout(
    source: DataSourceConfig,
    timeoutMs: number
  ): Promise<SourceExecutionResult> {
    if (!source.enabled) {
      return {
        sourceName: source.name,
        status: 'disabled',
        duration: 0,
        retries: 0,
        timestamp: Date.now(),
      };
    }

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs);
    });

    try {
      const result = await Promise.race([
        this.fetchWithRetry(source.name, source.maxRetries || this.config.maxRetries),
        timeoutPromise,
      ]);
      return result;
    } catch (error) {
      console.error(`Source "${source.name}" execution failed:`, error);
      return {
        sourceName: source.name,
        status: 'timeout',
        error: error instanceof Error ? error : new Error(String(error)),
        duration: timeoutMs,
        retries: 0,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Fetch from a source with retry logic
   */
  private async fetchWithRetry(
    sourceName: string,
    maxRetries: number
  ): Promise<SourceExecutionResult> {
    const source = this.coordinator.getSource(sourceName);

    if (!source) {
      throw new Error(`Source "${sourceName}" not found`);
    }

    let lastError: Error | undefined;
    let attempt = 0;
    const startTime = Date.now();

    while (attempt <= maxRetries) {
      try {
        console.log(
          `Fetching from ${source.name}${attempt > 0 ? ` (retry ${attempt}/${maxRetries})` : ''}...`
        );

        const data = await source.fetcher();
        const duration = Date.now() - startTime;

        console.log(`✓ ${source.name} succeeded in ${duration}ms`);

        return {
          sourceName: source.name,
          status: 'success',
          data,
          duration,
          retries: attempt,
          timestamp: Date.now(),
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`✗ ${source.name} failed (attempt ${attempt + 1}):`, lastError.message);

        attempt++;

        // Don't wait after the last attempt
        if (attempt <= maxRetries) {
          await this.exponentialBackoff(attempt);
        }
      }
    }

    const duration = Date.now() - startTime;

    return {
      sourceName: source.name,
      status: 'failure',
      error: lastError,
      duration,
      retries: maxRetries,
      timestamp: Date.now(),
    };
  }

  /**
   * Exponential backoff with jitter
   */
  private async exponentialBackoff(attempt: number): Promise<void> {
    let delay = this.retryConfig.baseDelayMs;

    if (this.retryConfig.exponentialBackoff) {
      delay = Math.min(
        this.retryConfig.baseDelayMs * Math.pow(2, attempt - 1),
        this.retryConfig.maxDelayMs
      );
    }

    // Add jitter (random ±25%)
    if (this.retryConfig.jitter) {
      const jitter = delay * 0.25;
      delay = delay + (Math.random() * jitter * 2 - jitter);
    }

    console.log(`Waiting ${Math.round(delay)}ms before retry...`);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  // ==========================================================================
  // Result Aggregation
  // ==========================================================================

  /**
   * Aggregate results from all sources
   */
  private aggregateResults(
    results: PromiseSettledResult<SourceExecutionResult>[],
    startTime: number
  ): MultiSourceData {
    const data: MultiSourceData = {
      metadata: {
        fetchedAt: startTime,
        sources: [],
        totalDuration: Date.now() - startTime,
        successCount: 0,
        failureCount: 0,
      },
    };

    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        const execResult = result.value;

        if (execResult.status === 'success' && execResult.data) {
          data.metadata.sources.push(execResult.sourceName);
          data.metadata.successCount++;

          // Map data to appropriate field
          const sourceName = execResult.sourceName.toLowerCase();
          if (sourceName.includes('codarmory')) {
            data.codarmory = execResult.data;
          } else if (sourceName.includes('wzstats')) {
            data.wzstats = execResult.data;
          } else if (sourceName.includes('codmunity')) {
            data.codmunity = execResult.data;
          }
        } else {
          data.metadata.failureCount++;
        }

        // Store execution result
        this.addToHistory(execResult);
      } else {
        data.metadata.failureCount++;
      }
    });

    return data;
  }

  /**
   * Create empty result
   */
  private createEmptyResult(startTime: number): MultiSourceData {
    return {
      metadata: {
        fetchedAt: startTime,
        sources: [],
        totalDuration: Date.now() - startTime,
        successCount: 0,
        failureCount: 0,
      },
    };
  }

  // ==========================================================================
  // Metrics & Health Monitoring
  // ==========================================================================

  /**
   * Update orchestrator metrics
   */
  private updateMetrics(
    results: PromiseSettledResult<SourceExecutionResult>[],
    totalDuration: number
  ): void {
    this.metrics.totalExecutions++;
    this.metrics.lastExecution = Date.now();

    // Update average duration
    const prevTotal = this.metrics.averageDuration * (this.metrics.totalExecutions - 1);
    this.metrics.averageDuration = (prevTotal + totalDuration) / this.metrics.totalExecutions;

    let hasSuccess = false;

    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        const execResult = result.value;
        const sourceName = execResult.sourceName;

        // Initialize source metrics if needed
        if (!this.metrics.sourceMetrics[sourceName]) {
          this.metrics.sourceMetrics[sourceName] = {
            executions: 0,
            successes: 0,
            failures: 0,
            averageDuration: 0,
          };
        }

        const sourceMetrics = this.metrics.sourceMetrics[sourceName];
        sourceMetrics.executions++;

        // Update average duration
        const prevAvg = sourceMetrics.averageDuration * (sourceMetrics.executions - 1);
        sourceMetrics.averageDuration =
          (prevAvg + execResult.duration) / sourceMetrics.executions;

        if (execResult.status === 'success') {
          sourceMetrics.successes++;
          sourceMetrics.lastSuccess = execResult.timestamp;
          hasSuccess = true;
        } else {
          sourceMetrics.failures++;
          sourceMetrics.lastFailure = execResult.timestamp;
        }
      }
    });

    if (hasSuccess) {
      this.metrics.successfulExecutions++;
    } else {
      this.metrics.failedExecutions++;
    }
  }

  /**
   * Update source health based on execution results
   */
  private updateSourceHealth(results: PromiseSettledResult<SourceExecutionResult>[]): void {
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        const execResult = result.value;
        const currentHealth = this.coordinator.getSourceHealth(execResult.sourceName);

        if (!currentHealth) return;

        let status: HealthStatus = 'healthy';
        let consecutiveFailures = currentHealth.consecutiveFailures;

        if (execResult.status === 'success') {
          consecutiveFailures = 0;
          status = 'healthy';
        } else if (execResult.status === 'timeout') {
          consecutiveFailures++;
          status = consecutiveFailures > 2 ? 'down' : 'degraded';
        } else {
          consecutiveFailures++;
          status = consecutiveFailures > 3 ? 'down' : 'degraded';
        }

        // Calculate uptime (last 100 executions)
        const history = this.executionHistory
          .filter((h) => h.sourceName === execResult.sourceName)
          .slice(-100);
        const successCount = history.filter((h) => h.status === 'success').length;
        const uptime = history.length > 0 ? (successCount / history.length) * 100 : 100;

        // Update average latency
        const latencyHistory = history.filter((h) => h.status === 'success').slice(-10);
        const avgLatency =
          latencyHistory.length > 0
            ? latencyHistory.reduce((sum, h) => sum + h.duration, 0) / latencyHistory.length
            : currentHealth.averageLatency;

        const healthReport: SourceHealthReport = {
          sourceName: execResult.sourceName,
          status,
          lastSuccessfulFetch:
            execResult.status === 'success' ? execResult.timestamp : currentHealth.lastSuccessfulFetch,
          lastFailure:
            execResult.status !== 'success' ? execResult.timestamp : currentHealth.lastFailure,
          consecutiveFailures,
          averageLatency: avgLatency,
          uptime,
          message: execResult.error?.message,
        };

        this.coordinator.updateSourceHealth(healthReport);
      }
    });
  }

  /**
   * Auto-manage sources based on health
   */
  private autoManageSources(): void {
    // Auto-disable unhealthy sources
    const disabled = this.coordinator.autoDisableUnhealthySources(5);
    if (disabled.length > 0) {
      console.warn(`Auto-disabled unhealthy sources: ${disabled.join(', ')}`);
    }

    // Auto-enable recovered sources
    const enabled = this.coordinator.autoEnableRecoveredSources();
    if (enabled.length > 0) {
      console.log(`Auto-enabled recovered sources: ${enabled.join(', ')}`);
    }
  }

  /**
   * Add execution result to history
   */
  private addToHistory(result: SourceExecutionResult): void {
    this.executionHistory.push(result);

    // Keep history size manageable
    if (this.executionHistory.length > this.maxHistorySize) {
      this.executionHistory = this.executionHistory.slice(-this.maxHistorySize);
    }
  }

  // ==========================================================================
  // Health Checks
  // ==========================================================================

  /**
   * Check health of all sources
   */
  async checkSourceHealth(): Promise<SourceHealthReport[]> {
    console.log('Checking health of all sources...');

    const sources = this.coordinator.getAllSources();
    const healthChecks = sources.map(async (source) => {
      const startTime = Date.now();

      try {
        // Quick health check with short timeout
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Health check timeout')), 5000);
        });

        await Promise.race([source.fetcher(), timeoutPromise]);

        const latency = Date.now() - startTime;

        return {
          sourceName: source.name,
          status: 'healthy' as HealthStatus,
          lastSuccessfulFetch: Date.now(),
          consecutiveFailures: 0,
          averageLatency: latency,
          uptime: 100,
        };
      } catch (error) {
        return {
          sourceName: source.name,
          status: 'down' as HealthStatus,
          lastFailure: Date.now(),
          consecutiveFailures: 1,
          averageLatency: 0,
          uptime: 0,
          message: error instanceof Error ? error.message : String(error),
        };
      }
    });

    const reports = await Promise.all(healthChecks);

    // Update health in coordinator
    reports.forEach((report) => {
      this.coordinator.updateSourceHealth(report);
    });

    return reports;
  }

  // ==========================================================================
  // Getters & Utilities
  // ==========================================================================

  /**
   * Get orchestrator metrics
   */
  getMetrics(): OrchestratorMetrics {
    return { ...this.metrics };
  }

  /**
   * Get execution history
   */
  getExecutionHistory(limit?: number): SourceExecutionResult[] {
    const history = [...this.executionHistory];
    return limit ? history.slice(-limit) : history;
  }

  /**
   * Get overall system health
   */
  getOverallHealth() {
    return this.coordinator.getOverallHealth();
  }

  /**
   * Get source coordinator
   */
  getCoordinator(): SourceCoordinator {
    return this.coordinator;
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = this.initializeMetrics();
    this.executionHistory = [];
    console.log('Metrics and history reset');
  }
}

// Export singleton instance
export const orchestrator = new DataSourceOrchestrator();
