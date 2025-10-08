/**
 * Conflict Resolution Engine
 *
 * Provides intelligent conflict resolution strategies for merging data
 * from multiple sources with different confidence levels, timestamps,
 * and priorities.
 *
 * Supports five resolution strategies:
 * 1. Weighted Average - For numeric values, weighted by confidence
 * 2. Highest Confidence - Pick the source with highest confidence
 * 3. Most Recent - Pick the newest data by timestamp
 * 4. Priority-Based - Use predefined source priority hierarchy
 * 5. Consensus - Pick the most common value across sources
 */

import { DataSource } from '../lineage/lineage-schema';
import type { SourceRecord, MultiSourceField } from '../lineage/lineage-schema';

// Re-export DataSource for convenience
export { DataSource };

// ============================================================================
// Source Priority Configuration
// ============================================================================

/**
 * Source priority map - lower number = higher priority
 * Used by the priority-based resolution strategy
 */
export const SOURCE_PRIORITY: Record<string, number> = {
  [DataSource.MANUAL]: 1,           // Highest priority - manually verified data
  [DataSource.OFFICIAL_API]: 1,     // Same as manual - official API data
  [DataSource.CODARMORY]: 2,        // Official/authoritative CoD source
  [DataSource.WZSTATS]: 3,          // Reliable community source
  [DataSource.WIKI]: 3,             // Same as wzstats - community maintained
  [DataSource.CODMUNITY]: 4,        // Community-driven source
  [DataSource.USER_SUBMISSION]: 5,  // User-submitted data - lowest priority
  [DataSource.COMPUTED]: 5,         // Computed values
  [DataSource.IMAGE_ANALYSIS]: 6,   // Automated analysis - lowest reliability
  [DataSource.UNKNOWN]: 7,          // Unknown source - fallback only
};

// ============================================================================
// Resolution Strategy Types
// ============================================================================

/**
 * Available conflict resolution strategies
 */
export type ResolutionStrategy =
  | 'weighted_average'  // Weighted by confidence scores
  | 'highest_confidence' // Pick highest confidence source
  | 'most_recent'       // Pick newest timestamp
  | 'priority_based'    // Use SOURCE_PRIORITY map
  | 'consensus';        // Most common value

/**
 * Configuration for conflict detection
 */
export interface ConflictDetectionConfig {
  /**
   * Threshold for numeric conflict detection
   * If (max - min) / avg > threshold, it's a conflict
   * Default: 0.15 (15% variance)
   */
  numericThreshold: number;

  /**
   * Whether to consider timestamp differences
   * If true, recent data may override older conflicting data
   */
  considerTimestamp: boolean;

  /**
   * Maximum age difference (ms) to consider sources comparable
   * Sources older than this are considered stale
   * Default: 30 days
   */
  maxAgeDifferenceMs: number;
}

/**
 * Result of conflict resolution
 */
export interface ResolutionResult<T = any> {
  /** Resolved value */
  value: T;

  /** Strategy used for resolution */
  strategy: ResolutionStrategy;

  /** Whether a conflict was detected */
  hadConflict: boolean;

  /** Confidence score of the resolved value (0-1) */
  confidence: number;

  /** Source that provided the resolved value */
  primarySource: DataSource;

  /** All sources that contributed to this resolution */
  contributingSources: DataSource[];

  /** Number of sources in conflict */
  conflictCount: number;

  /** Additional metadata about the resolution */
  metadata?: {
    variance?: number;        // For numeric values
    consensusCount?: number;  // For consensus strategy
    averageAge?: number;      // Average age of sources (ms)
  };
}

// ============================================================================
// Conflict Resolver Class
// ============================================================================

/**
 * Intelligent conflict resolver for multi-source data
 *
 * Provides multiple strategies for resolving conflicts between
 * different data sources with varying confidence levels and ages.
 */
export class ConflictResolver {
  private config: ConflictDetectionConfig;

  constructor(config?: Partial<ConflictDetectionConfig>) {
    this.config = {
      numericThreshold: config?.numericThreshold ?? 0.15,
      considerTimestamp: config?.considerTimestamp ?? true,
      maxAgeDifferenceMs: config?.maxAgeDifferenceMs ?? 30 * 24 * 60 * 60 * 1000, // 30 days
    };
  }

  // ==========================================================================
  // Main Resolution Method
  // ==========================================================================

  /**
   * Resolves conflicts using the specified strategy
   *
   * @param sources - Array of source records with values
   * @param strategy - Resolution strategy to use
   * @param valueType - Type hint for the value ('number', 'string', 'object', etc.)
   * @returns Resolution result with resolved value and metadata
   */
  resolve<T = any>(
    sources: SourceRecord[],
    strategy: ResolutionStrategy = 'weighted_average',
    valueType: 'number' | 'string' | 'object' | 'array' = 'number'
  ): ResolutionResult<T> {
    // Validate input
    if (!sources || sources.length === 0) {
      throw new Error('Cannot resolve conflicts: no sources provided');
    }

    // Single source - no conflict
    if (sources.length === 1) {
      return {
        value: sources[0].value,
        strategy,
        hadConflict: false,
        confidence: this.getSourceConfidence(sources[0]),
        primarySource: sources[0].source,
        contributingSources: [sources[0].source],
        conflictCount: 0,
      };
    }

    // Detect if there's an actual conflict
    const hasConflict = this.detectConflict(sources, valueType);

    // Filter out stale sources if configured
    const validSources = this.config.considerTimestamp
      ? this.filterStaleSources(sources)
      : sources;

    // Apply resolution strategy
    switch (strategy) {
      case 'weighted_average':
        return this.resolveWeightedAverage(validSources, hasConflict);

      case 'highest_confidence':
        return this.resolveHighestConfidence(validSources, hasConflict);

      case 'most_recent':
        return this.resolveMostRecent(validSources, hasConflict);

      case 'priority_based':
        return this.resolvePriorityBased(validSources, hasConflict);

      case 'consensus':
        return this.resolveConsensus(validSources, hasConflict);

      default:
        throw new Error(`Unknown resolution strategy: ${strategy}`);
    }
  }

  /**
   * Automatically selects the best resolution strategy based on data type
   * and source characteristics
   *
   * @param sources - Array of source records
   * @param valueType - Type of the value
   * @returns Recommended resolution strategy
   */
  selectStrategy(
    sources: SourceRecord[],
    valueType: 'number' | 'string' | 'object' | 'array'
  ): ResolutionStrategy {
    // For numeric values, prefer weighted average if we have confidence scores
    if (valueType === 'number') {
      const hasVariedConfidence = this.hasVariedConfidence(sources);
      return hasVariedConfidence ? 'weighted_average' : 'highest_confidence';
    }

    // For strings/enums, prefer consensus if we have multiple sources
    if (valueType === 'string' && sources.length >= 3) {
      return 'consensus';
    }

    // For complex objects/arrays, prefer most recent or highest confidence
    if (valueType === 'object' || valueType === 'array') {
      const hasTimestamps = sources.every(s => s.timestamp > 0);
      return hasTimestamps ? 'most_recent' : 'highest_confidence';
    }

    // Default to priority-based
    return 'priority_based';
  }

  // ==========================================================================
  // Strategy 1: Weighted Average
  // ==========================================================================

  /**
   * Resolves numeric conflicts using weighted average
   * Formula: Σ(value_i × confidence_i) / Σ(confidence_i)
   *
   * @param sources - Source records with numeric values
   * @param hadConflict - Whether a conflict was detected
   * @returns Resolution result
   */
  private resolveWeightedAverage<T = number>(
    sources: SourceRecord[],
    hadConflict: boolean
  ): ResolutionResult<T> {
    // Calculate weighted average
    let weightedSum = 0;
    let totalWeight = 0;

    for (const source of sources) {
      const value = Number(source.value);
      const confidence = this.getSourceConfidence(source);

      if (isNaN(value)) {
        console.warn(`Non-numeric value in weighted average: ${source.value}`);
        continue;
      }

      weightedSum += value * confidence;
      totalWeight += confidence;
    }

    if (totalWeight === 0) {
      throw new Error('Cannot compute weighted average: total weight is zero');
    }

    const resolvedValue = weightedSum / totalWeight;
    const averageConfidence = totalWeight / sources.length;

    // Calculate variance for metadata
    const values = sources.map(s => Number(s.value)).filter(v => !isNaN(v));
    const variance = this.calculateVariance(values);

    return {
      value: resolvedValue as T,
      strategy: 'weighted_average',
      hadConflict,
      confidence: averageConfidence,
      primarySource: this.findClosestSource(sources, resolvedValue),
      contributingSources: sources.map(s => s.source),
      conflictCount: hadConflict ? sources.length : 0,
      metadata: {
        variance,
        averageAge: this.calculateAverageAge(sources),
      },
    };
  }

  // ==========================================================================
  // Strategy 2: Highest Confidence
  // ==========================================================================

  /**
   * Resolves conflicts by picking the source with highest confidence
   *
   * @param sources - Source records
   * @param hadConflict - Whether a conflict was detected
   * @returns Resolution result
   */
  private resolveHighestConfidence(
    sources: SourceRecord[],
    hadConflict: boolean
  ): ResolutionResult {
    let bestSource = sources[0];
    let bestConfidence = this.getSourceConfidence(bestSource);

    for (const source of sources) {
      const confidence = this.getSourceConfidence(source);
      if (confidence > bestConfidence) {
        bestConfidence = confidence;
        bestSource = source;
      }
    }

    return {
      value: bestSource.value,
      strategy: 'highest_confidence',
      hadConflict,
      confidence: bestConfidence,
      primarySource: bestSource.source,
      contributingSources: sources.map(s => s.source),
      conflictCount: hadConflict ? sources.length : 0,
      metadata: {
        averageAge: this.calculateAverageAge(sources),
      },
    };
  }

  // ==========================================================================
  // Strategy 3: Most Recent
  // ==========================================================================

  /**
   * Resolves conflicts by picking the source with the most recent timestamp
   *
   * @param sources - Source records
   * @param hadConflict - Whether a conflict was detected
   * @returns Resolution result
   */
  private resolveMostRecent(
    sources: SourceRecord[],
    hadConflict: boolean
  ): ResolutionResult {
    let mostRecentSource = sources[0];
    let mostRecentTimestamp = mostRecentSource.timestamp || 0;

    for (const source of sources) {
      const timestamp = source.timestamp || 0;
      if (timestamp > mostRecentTimestamp) {
        mostRecentTimestamp = timestamp;
        mostRecentSource = source;
      }
    }

    const confidence = this.getSourceConfidence(mostRecentSource);

    return {
      value: mostRecentSource.value,
      strategy: 'most_recent',
      hadConflict,
      confidence,
      primarySource: mostRecentSource.source,
      contributingSources: sources.map(s => s.source),
      conflictCount: hadConflict ? sources.length : 0,
      metadata: {
        averageAge: this.calculateAverageAge(sources),
      },
    };
  }

  // ==========================================================================
  // Strategy 4: Priority-Based
  // ==========================================================================

  /**
   * Resolves conflicts using predefined source priority hierarchy
   * Uses SOURCE_PRIORITY map where lower number = higher priority
   *
   * @param sources - Source records
   * @param hadConflict - Whether a conflict was detected
   * @returns Resolution result
   */
  private resolvePriorityBased(
    sources: SourceRecord[],
    hadConflict: boolean
  ): ResolutionResult {
    let highestPrioritySource = sources[0];
    let highestPriority = SOURCE_PRIORITY[sources[0].source] ?? 999;

    for (const source of sources) {
      const priority = SOURCE_PRIORITY[source.source] ?? 999;
      if (priority < highestPriority) {
        highestPriority = priority;
        highestPrioritySource = source;
      }
    }

    const confidence = this.getSourceConfidence(highestPrioritySource);

    return {
      value: highestPrioritySource.value,
      strategy: 'priority_based',
      hadConflict,
      confidence,
      primarySource: highestPrioritySource.source,
      contributingSources: sources.map(s => s.source),
      conflictCount: hadConflict ? sources.length : 0,
      metadata: {
        averageAge: this.calculateAverageAge(sources),
      },
    };
  }

  // ==========================================================================
  // Strategy 5: Consensus
  // ==========================================================================

  /**
   * Resolves conflicts by picking the most common value across sources
   * Useful for categorical/enum values
   *
   * @param sources - Source records
   * @param hadConflict - Whether a conflict was detected
   * @returns Resolution result
   */
  private resolveConsensus(
    sources: SourceRecord[],
    hadConflict: boolean
  ): ResolutionResult {
    // Count occurrences of each value
    const valueCounts = new Map<any, { count: number; sources: SourceRecord[] }>();

    for (const source of sources) {
      const valueKey = JSON.stringify(source.value);
      const existing = valueCounts.get(valueKey);

      if (existing) {
        existing.count++;
        existing.sources.push(source);
      } else {
        valueCounts.set(valueKey, { count: 1, sources: [source] });
      }
    }

    // Find most common value
    let maxCount = 0;
    let consensusValue: any;
    let consensusSources: SourceRecord[] = [];

    // Iterate over Map entries
    valueCounts.forEach(({ count, sources: valueSources }, valueKey) => {
      if (count > maxCount) {
        maxCount = count;
        consensusValue = JSON.parse(valueKey);
        consensusSources = valueSources;
      }
    });

    // Calculate average confidence of consensus sources
    const avgConfidence = consensusSources.reduce(
      (sum, s) => sum + this.getSourceConfidence(s),
      0
    ) / consensusSources.length;

    return {
      value: consensusValue,
      strategy: 'consensus',
      hadConflict,
      confidence: avgConfidence,
      primarySource: consensusSources[0].source,
      contributingSources: sources.map(s => s.source),
      conflictCount: hadConflict ? sources.length - maxCount : 0,
      metadata: {
        consensusCount: maxCount,
        averageAge: this.calculateAverageAge(sources),
      },
    };
  }

  // ==========================================================================
  // Conflict Detection
  // ==========================================================================

  /**
   * Detects if there's a conflict between source values
   *
   * @param sources - Source records to check
   * @param valueType - Type of the value
   * @returns True if conflict detected
   */
  private detectConflict(
    sources: SourceRecord[],
    valueType: 'number' | 'string' | 'object' | 'array'
  ): boolean {
    if (sources.length <= 1) {
      return false;
    }

    if (valueType === 'number') {
      return this.detectNumericConflict(sources);
    }

    // For non-numeric types, check if all values are equal
    const firstValue = JSON.stringify(sources[0].value);
    return sources.some(s => JSON.stringify(s.value) !== firstValue);
  }

  /**
   * Detects numeric conflicts using threshold-based variance
   * Conflict if: (max - min) / avg > threshold
   *
   * @param sources - Source records with numeric values
   * @returns True if conflict detected
   */
  private detectNumericConflict(sources: SourceRecord[]): boolean {
    const values = sources.map(s => Number(s.value)).filter(v => !isNaN(v));

    if (values.length <= 1) {
      return false;
    }

    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;

    if (avg === 0) {
      return min !== max; // If average is 0, any difference is a conflict
    }

    const variance = (max - min) / Math.abs(avg);
    return variance > this.config.numericThreshold;
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  /**
   * Gets confidence score for a source
   * Uses source reliability from lineage schema
   *
   * @param source - Source record
   * @returns Confidence score (0-1)
   */
  private getSourceConfidence(source: SourceRecord): number {
    // If source has explicit confidence, use it
    // Otherwise, use source reliability from priority map
    const priorityScore = SOURCE_PRIORITY[source.source] ?? 999;

    // Convert priority to confidence (inverse relationship)
    // Priority 1 = 1.0 confidence, Priority 7 = 0.3 confidence
    const baseConfidence = Math.max(0.3, 1.0 - (priorityScore - 1) * 0.1);

    // Apply freshness decay if timestamp available
    if (source.timestamp && this.config.considerTimestamp) {
      const ageMs = Date.now() - source.timestamp;
      const ageDays = ageMs / (1000 * 60 * 60 * 24);
      const freshnessFactor = Math.max(0.5, 1.0 - ageDays * 0.01); // 1% decay per day
      return baseConfidence * freshnessFactor;
    }

    return baseConfidence;
  }

  /**
   * Filters out stale sources based on max age configuration
   *
   * @param sources - Source records to filter
   * @returns Filtered sources
   */
  private filterStaleSources(sources: SourceRecord[]): SourceRecord[] {
    const now = Date.now();
    const filtered = sources.filter(s => {
      if (!s.timestamp) return true; // Keep sources without timestamp
      return (now - s.timestamp) <= this.config.maxAgeDifferenceMs;
    });

    // If all sources are stale, keep them all
    return filtered.length > 0 ? filtered : sources;
  }

  /**
   * Checks if sources have varied confidence scores
   *
   * @param sources - Source records
   * @returns True if confidence varies significantly
   */
  private hasVariedConfidence(sources: SourceRecord[]): boolean {
    const confidences = sources.map(s => this.getSourceConfidence(s));
    const min = Math.min(...confidences);
    const max = Math.max(...confidences);
    return (max - min) > 0.2; // 20% variance
  }

  /**
   * Finds the source with value closest to target
   *
   * @param sources - Source records
   * @param targetValue - Target value to match
   * @returns Source with closest value
   */
  private findClosestSource(sources: SourceRecord[], targetValue: number): DataSource {
    let closestSource = sources[0];
    let minDiff = Math.abs(Number(sources[0].value) - targetValue);

    for (const source of sources) {
      const diff = Math.abs(Number(source.value) - targetValue);
      if (diff < minDiff) {
        minDiff = diff;
        closestSource = source;
      }
    }

    return closestSource.source;
  }

  /**
   * Calculates variance of numeric values
   *
   * @param values - Array of numbers
   * @returns Variance
   */
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;

    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length;
  }

  /**
   * Calculates average age of sources in milliseconds
   *
   * @param sources - Source records
   * @returns Average age in ms
   */
  private calculateAverageAge(sources: SourceRecord[]): number {
    const now = Date.now();
    const ages = sources
      .filter(s => s.timestamp)
      .map(s => now - s.timestamp);

    if (ages.length === 0) return 0;
    return ages.reduce((sum, age) => sum + age, 0) / ages.length;
  }

  /**
   * Updates configuration
   *
   * @param config - New configuration values
   */
  updateConfig(config: Partial<ConflictDetectionConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }

  /**
   * Gets current configuration
   *
   * @returns Current conflict detection config
   */
  getConfig(): ConflictDetectionConfig {
    return { ...this.config };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

/**
 * Default conflict resolver instance with standard configuration
 */
export const conflictResolver = new ConflictResolver();

/**
 * Export the class as default for custom instantiation
 */
export default ConflictResolver;
