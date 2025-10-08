"use strict";
/**
 * Data Lineage Schema
 *
 * Complete type definitions for the data lineage tracking system.
 * Tracks data sources, confidence scores, and data quality metrics.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_CONFIDENCE_CONFIG = exports.SOURCE_RELIABILITY = exports.DataSource = void 0;
/**
 * Enumeration of possible data sources
 */
var DataSource;
(function (DataSource) {
    /** Official Duelyst API (legacy) */
    DataSource["OFFICIAL_API"] = "official_api";
    /** Community wiki (legacy) */
    DataSource["WIKI"] = "wiki";
    /** User submissions */
    DataSource["USER_SUBMISSION"] = "user_submission";
    /** Manual entry */
    DataSource["MANUAL"] = "manual";
    /** Image analysis via OCR */
    DataSource["IMAGE_ANALYSIS"] = "image_analysis";
    /** Unknown or legacy source */
    DataSource["UNKNOWN"] = "unknown";
    /** CODArmory - Official/authoritative CoD data source */
    DataSource["CODARMORY"] = "codarmory";
    /** WZStats - Warzone statistics and analytics */
    DataSource["WZSTATS"] = "wzstats";
    /** CODMunity - Community-driven CoD data */
    DataSource["CODMUNITY"] = "codmunity";
    /** Computed values from other sources */
    DataSource["COMPUTED"] = "computed";
})(DataSource || (exports.DataSource = DataSource = {}));
/**
 * Source reliability scores (0-1 scale)
 */
exports.SOURCE_RELIABILITY = {
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
 * Default confidence configuration
 */
exports.DEFAULT_CONFIDENCE_CONFIG = {
    freshnessDecayRate: 0.05,
    staleThresholdDays: 30,
    minQualityFactor: 0.5,
    maxQualityFactor: 1.0,
    conflictPenalty: 0.05,
    maxConflictPenalty: 0.3,
};
//# sourceMappingURL=lineage-schema.js.map