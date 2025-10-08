// ============================================================================
// Data Source Orchestrator - Type Definitions
// ============================================================================
// Comprehensive type definitions for the multi-source data orchestration system.
// Defines data capabilities, source configurations, execution results,
// health monitoring, and metrics tracking.
// ============================================================================

import type { CODArmoryAttachment, CODArmoryWeapon } from '../scrapers/codarmory-fetcher';
import type { CODMunityStats } from '../scrapers/codmunity-scraper';
import type { WZStatsWeapon } from '../scrapers/wzstats-scraper';

/**
 * Data capabilities provided by each source
 */
export type DataCapability =
  | 'baseStats'
  | 'attachments'
  | 'tier'
  | 'winRate'
  | 'pickRate'
  | 'ttk'
  | 'damageRanges'
  | 'recoil'
  | 'bulletVelocity'
  | 'movementSpeed';

/**
 * Update frequency for data sources
 */
export type UpdateFrequency = 'realtime' | 'hourly' | 'daily' | 'weekly' | 'monthly';

/**
 * Health status of a data source
 */
export type HealthStatus = 'healthy' | 'degraded' | 'down' | 'unknown';

/**
 * Source reliability score (0-1)
 */
export type ReliabilityScore = number;

/**
 * Data source configuration
 */
export interface DataSourceConfig {
  name: string;
  priority: number;
  provides: DataCapability[];
  updateFrequency: UpdateFrequency;
  reliability: ReliabilityScore;
  fetcher: () => Promise<any>;
  enabled: boolean;
  timeout?: number; // milliseconds
  maxRetries?: number;
}

/**
 * Source execution result
 */
export interface SourceExecutionResult {
  sourceName: string;
  status: 'success' | 'failure' | 'timeout' | 'disabled';
  data?: any;
  error?: Error;
  duration: number; // milliseconds
  retries: number;
  timestamp: number;
}

/**
 * Source health report
 */
export interface SourceHealthReport {
  sourceName: string;
  status: HealthStatus;
  lastSuccessfulFetch?: number; // timestamp
  lastFailure?: number; // timestamp
  consecutiveFailures: number;
  averageLatency: number; // milliseconds
  uptime: number; // percentage 0-100
  message?: string;
}

/**
 * Multi-source aggregated data
 */
export interface MultiSourceData {
  codarmory?: {
    weapons: CODArmoryWeapon[];
    attachments: CODArmoryAttachment[];
    categories: any;
  };
  wzstats?: WZStatsWeapon[];
  codmunity?: CODMunityStats[];
  metadata: {
    fetchedAt: number;
    sources: string[];
    totalDuration: number;
    successCount: number;
    failureCount: number;
  };
}

/**
 * Orchestrator metrics
 */
export interface OrchestratorMetrics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageDuration: number;
  lastExecution?: number;
  sourceMetrics: Record<string, {
    executions: number;
    successes: number;
    failures: number;
    averageDuration: number;
    lastSuccess?: number;
    lastFailure?: number;
  }>;
}

/**
 * Orchestrator configuration
 */
export interface OrchestratorConfig {
  timeout: number; // Total timeout for all sources (ms)
  maxRetries: number; // Max retries per source
  parallelExecution: boolean; // Execute sources in parallel
  failFast: boolean; // Stop on first failure
  minSuccessfulSources: number; // Minimum successful sources required
}

/**
 * Retry strategy configuration
 */
export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  exponentialBackoff: boolean;
  jitter: boolean; // Add randomness to prevent thundering herd
}
