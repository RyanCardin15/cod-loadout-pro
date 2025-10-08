/**
 * Data Lineage Schema
 *
 * Complete type definitions for the data lineage tracking system.
 * Tracks data sources, confidence scores, and data quality metrics.
 */

/**
 * Enumeration of possible data sources
 */
export enum DataSource {
  /** Official Duelyst API (legacy) */
  OFFICIAL_API = 'official_api',
  /** Community wiki (legacy) */
  WIKI = 'wiki',
  /** User submissions */
  USER_SUBMISSION = 'user_submission',
  /** Manual entry */
  MANUAL = 'manual',
  /** Image analysis via OCR */
  IMAGE_ANALYSIS = 'image_analysis',
  /** Unknown or legacy source */
  UNKNOWN = 'unknown',
  /** CODArmory - Official/authoritative CoD data source */
  CODARMORY = 'codarmory',
  /** WZStats - Warzone statistics and analytics */
  WZSTATS = 'wzstats',
  /** CODMunity - Community-driven CoD data */
  CODMUNITY = 'codmunity',
  /** Computed values from other sources */
  COMPUTED = 'computed',
}

/**
 * Source reliability scores (0-1 scale)
 */
export const SOURCE_RELIABILITY: Record<DataSource, number> = {
  [DataSource.OFFICIAL_API]: 1.0,
  [DataSource.WIKI]: 0.8,
  [DataSource.USER_SUBMISSION]: 0.6,
  [DataSource.MANUAL]: 0.9,
  [DataSource.IMAGE_ANALYSIS]: 0.5,
  [DataSource.UNKNOWN]: 0.3,
  [DataSource.CODARMORY]: 0.9,
  [DataSource.WZSTATS]: 0.8,
  [DataSource.CODMUNITY]: 0.7,
  [DataSource.COMPUTED]: 0.6,
};

/**
 * Confidence score with metadata
 */
export interface ConfidenceScore {
  /** Overall confidence value (0-1) */
  value: number;
  /** Source reliability component (0-1) */
  sourceReliability: number;
  /** Data freshness component (0-1) */
  freshness: number;
  /** Data quality component (0-1) */
  quality: number;
  /** Timestamp when confidence was calculated */
  calculatedAt: number;
}

/**
 * Single source of data for a field
 */
export interface SourceRecord {
  /** Data source type */
  source: DataSource;
  /** Field value from this source */
  value: any;
  /** When this data was last updated */
  timestamp: number;
  /** Optional reference URL or ID */
  reference?: string;
  /** Optional notes about this source */
  notes?: string;
}

/**
 * Field with multiple potential sources
 */
export interface MultiSourceField {
  /** All sources providing data for this field */
  sources: SourceRecord[];
  /** Current primary/selected value */
  currentValue: any;
  /** Source of the current value */
  primarySource: DataSource;
  /** Confidence in the current value */
  confidence: ConfidenceScore;
  /** When the current value was last updated */
  lastUpdated: number;
  /** Whether there are conflicts between sources */
  hasConflict: boolean;
  /** Conflict details if any */
  conflictDetails?: ConflictDetail[];
}

/**
 * Details about a conflict between sources
 */
export interface ConflictDetail {
  /** Field name with conflict */
  field: string;
  /** Conflicting values from different sources */
  values: Array<{
    source: DataSource;
    value: any;
    timestamp: number;
  }>;
  /** When conflict was detected */
  detectedAt: number;
  /** Whether conflict has been resolved */
  resolved: boolean;
  /** How conflict was resolved */
  resolution?: string;
}

/**
 * Complete data lineage record for a weapon
 */
export interface DataLineage {
  /** Weapon ID */
  weaponId: string;
  /** Fields with lineage tracking */
  fields: Record<string, MultiSourceField>;
  /** Metadata about the lineage record */
  metadata: LineageMetadata;
  /** Creation timestamp */
  createdAt: number;
  /** Last update timestamp */
  updatedAt: number;
}

/**
 * Metadata about lineage tracking
 */
export interface LineageMetadata {
  /** Total number of data sources */
  totalSources: number;
  /** Average confidence across all fields */
  averageConfidence: number;
  /** Number of fields with conflicts */
  conflictCount: number;
  /** Number of stale data points (>30 days old) */
  staleDataCount: number;
  /** Last validation timestamp */
  lastValidated: number;
  /** Validation errors if any */
  validationErrors?: string[];
}

/**
 * Historical record of field changes
 */
export interface LineageHistoryRecord {
  /** Weapon ID */
  weaponId: string;
  /** Field name that changed */
  field: string;
  /** Previous value */
  oldValue: any;
  /** New value */
  newValue: any;
  /** Data source for new value */
  source: DataSource;
  /** Change timestamp */
  timestamp: number;
  /** Confidence score at time of change */
  confidence: ConfidenceScore;
  /** Optional reason for change */
  reason?: string;
  /** Optional reference */
  reference?: string;
}

/**
 * Query filters for lineage history
 */
export interface LineageQueryFilters {
  /** Filter by weapon ID */
  weaponId?: string;
  /** Filter by field name */
  field?: string;
  /** Filter by data source */
  source?: DataSource;
  /** Start of time range */
  startTime?: number;
  /** End of time range */
  endTime?: number;
  /** Minimum confidence threshold */
  minConfidence?: number;
  /** Only show conflicts */
  conflictsOnly?: boolean;
}

/**
 * Statistics about data lineage
 */
export interface LineageStatistics {
  /** Total number of tracked fields */
  totalFields: number;
  /** Average confidence score */
  averageConfidence: number;
  /** Number of conflicts */
  conflictCount: number;
  /** Number of stale data points */
  staleCount: number;
  /** Data completeness percentage (0-100) */
  completeness: number;
  /** Sources breakdown */
  sourceBreakdown: Record<DataSource, number>;
  /** Last update timestamp */
  lastUpdated: number;
}

/**
 * Configuration for confidence calculation
 */
export interface ConfidenceConfig {
  /** Freshness decay rate (per day) */
  freshnessDecayRate: number;
  /** Stale threshold in days */
  staleThresholdDays: number;
  /** Minimum quality factor */
  minQualityFactor: number;
  /** Maximum quality factor */
  maxQualityFactor: number;
  /** Conflict penalty per conflict */
  conflictPenalty: number;
  /** Maximum conflict penalty */
  maxConflictPenalty: number;
}

/**
 * Default confidence configuration
 */
export const DEFAULT_CONFIDENCE_CONFIG: ConfidenceConfig = {
  freshnessDecayRate: 0.05,
  staleThresholdDays: 30,
  minQualityFactor: 0.5,
  maxQualityFactor: 1.0,
  conflictPenalty: 0.05,
  maxConflictPenalty: 0.3,
};

/**
 * Field history entry for tracking changes over time
 */
export interface FieldHistoryEntry {
  /** Field value */
  value: any;
  /** Data source */
  source: DataSource;
  /** Timestamp */
  timestamp: number;
  /** Confidence score */
  confidence: ConfidenceScore;
}

/**
 * Complete history for a field
 */
export interface FieldHistory {
  /** Weapon ID */
  weaponId: string;
  /** Field name */
  field: string;
  /** Historical entries ordered by timestamp (newest first) */
  history: FieldHistoryEntry[];
  /** Current value */
  currentValue: any;
  /** Number of changes */
  changeCount: number;
}
