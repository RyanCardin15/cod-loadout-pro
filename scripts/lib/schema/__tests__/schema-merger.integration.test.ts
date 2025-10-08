/**
 * Integration tests for SchemaMerger
 *
 * These tests validate that the schema-merger correctly:
 * - Merges data from multiple sources
 * - Integrates with LineageTracker and ConflictResolver
 * - Handles edge cases and conflicts
 * - Produces valid UnifiedWeapon objects
 */

import { SchemaMerger, extractWeaponId, weaponsMatch, mergeAttachments } from '../schema-merger';
import type { SourcedWeaponData } from '../schema-merger';
import { DataSource } from '../../lineage/lineage-schema';
import type { UnifiedWeapon } from '../../../../server/src/models/unified-weapon.model';

describe('SchemaMerger Integration Tests', () => {
  let merger: SchemaMerger;

  beforeEach(() => {
    merger = new SchemaMerger({
      defaultStatStrategy: 'weighted_average',
      defaultMetaStrategy: 'consensus',
      defaultBallisticsStrategy: 'highest_confidence',
      preserveAllSources: true,
      minConfidenceThreshold: 0.3,
      autoResolveConflicts: true,
    });
  });

  describe('Test 1: Basic Merge (2 sources)', () => {
    it('should merge weapon data from 2 sources without conflicts', () => {
      const weaponId = 'test-weapon-001';
      const now = Date.now();

      const sources: SourcedWeaponData[] = [
        {
          source: DataSource.CODARMORY,
          timestamp: now - 3600000, // 1 hour ago
          data: {
            name: 'MCW',
            game: 'MW3',
            category: 'AR',
            stats: {
              damage: 75,
              range: 70,
              accuracy: 80,
              fireRate: 60,
              mobility: 65,
              control: 75,
              handling: 70,
            },
            meta: {
              tier: 'A',
              popularity: 85,
              pickRate: 15.5,
              winRate: 52.3,
              kd: 1.25,
            },
            ballistics: {
              fireRate: 750,
              magazineSize: 30,
              reloadTime: 2.1,
              ttk: { min: 250, max: 400 },
            },
          },
        },
        {
          source: DataSource.WZSTATS,
          timestamp: now, // Now
          data: {
            name: 'MCW',
            game: 'MW3',
            category: 'AR',
            stats: {
              damage: 75,
              range: 68,
              accuracy: 82,
              fireRate: 62,
              mobility: 67,
              control: 76,
              handling: 71,
            },
            meta: {
              tier: 'A',
              usage: 87,
              pickRate: 16.2,
              winRate: 53.1,
              kd: 1.28,
            },
            ballistics: {
              fireRate: 750,
              magazineSize: 30,
              reloadTime: 2.1,
              ttk: { min: 250, max: 400 },
            },
          },
        },
      ];

      const result = merger.mergeWeapons(weaponId, sources);

      // Verify result structure
      expect(result).toBeDefined();
      expect(result.weapon).toBeDefined();
      expect(result.stats).toBeDefined();
      expect(result.warnings).toBeDefined();
      expect(result.errors).toHaveLength(0);

      // Verify weapon properties
      const weapon = result.weapon;
      expect(weapon.id).toBe(weaponId);
      expect(weapon.name).toBe('MCW');
      expect(weapon.game).toBe('MW3');
      expect(weapon.category).toBe('AR');

      // Verify stats have MultiSourceField structure
      expect(weapon.stats.damage).toBeDefined();
      expect(weapon.stats.damage.currentValue).toBe(75); // Same value from both
      expect(weapon.stats.damage.sources).toHaveLength(2);
      expect(weapon.stats.damage.confidence).toBeDefined();
      expect(weapon.stats.damage.confidence.value).toBeGreaterThan(0);
      expect(weapon.stats.damage.confidence.value).toBeLessThanOrEqual(1);

      // Verify lineage metadata
      expect(weapon.lineage).toBeDefined();
      expect(weapon.lineage.totalSources).toBe(2);
      expect(weapon.lineage.averageConfidence).toBeGreaterThan(0);
      expect(weapon.lineage.contributingSources).toContain(DataSource.CODARMORY);
      expect(weapon.lineage.contributingSources).toContain(DataSource.WZSTATS);

      // Verify merge stats
      expect(result.stats.sourcesProcessed).toBe(2);
      expect(result.stats.fieldsResolved).toBeGreaterThan(0);
    });
  });

  describe('Test 2: Conflict Resolution (3 sources)', () => {
    it('should detect and resolve conflicts between 3 sources', () => {
      const weaponId = 'test-weapon-002';
      const now = Date.now();

      const sources: SourcedWeaponData[] = [
        {
          source: DataSource.CODARMORY,
          timestamp: now - 86400000, // 1 day ago
          data: {
            name: 'Holger 556',
            game: 'MW3',
            category: 'AR',
            stats: {
              damage: 70,
              range: 65,
              accuracy: 75,
              fireRate: 58,
              mobility: 60,
              control: 70,
              handling: 65,
            },
            meta: {
              tier: 'B',
            },
            ballistics: {},
          },
        },
        {
          source: DataSource.WZSTATS,
          timestamp: now - 3600000, // 1 hour ago
          data: {
            name: 'Holger 556',
            game: 'MW3',
            category: 'AR',
            stats: {
              damage: 75, // Conflict
              range: 68, // Conflict
              accuracy: 78, // Conflict
              fireRate: 60,
              mobility: 62,
              control: 72,
              handling: 67,
            },
            meta: {
              tier: 'A', // Conflict
            },
            ballistics: {},
          },
        },
        {
          source: DataSource.CODMUNITY,
          timestamp: now, // Most recent
          data: {
            name: 'Holger 556',
            game: 'MW3',
            category: 'AR',
            stats: {
              damage: 72, // Conflict
              range: 66,
              accuracy: 76,
              fireRate: 59,
              mobility: 61,
              control: 71,
              handling: 66,
            },
            meta: {
              tier: 'A', // Consensus with WZSTATS
            },
            ballistics: {},
          },
        },
      ];

      const result = merger.mergeWeapons(weaponId, sources);

      expect(result.weapon).toBeDefined();
      const weapon = result.weapon;

      // Verify conflicts were detected
      expect(weapon.lineage.conflictCount).toBeGreaterThan(0);

      // Verify damage was resolved (weighted average should be between 70-75)
      expect(weapon.stats.damage.currentValue).toBeGreaterThanOrEqual(70);
      expect(weapon.stats.damage.currentValue).toBeLessThanOrEqual(75);
      expect(weapon.stats.damage.hasConflict).toBe(true);

      // Verify tier was resolved (consensus should pick 'A' - 2 sources vs 1)
      expect(weapon.meta.tier.currentValue).toBe('A');
      expect(weapon.meta.tier.sources).toHaveLength(3);

      // Verify all sources tracked
      expect(weapon.lineage.totalSources).toBe(3);
    });
  });

  describe('Test 3: Single Source', () => {
    it('should handle single source without creating conflicts', () => {
      const weaponId = 'test-weapon-003';
      const now = Date.now();

      const sources: SourcedWeaponData[] = [
        {
          source: DataSource.CODARMORY,
          timestamp: now,
          data: {
            name: 'SVA 545',
            game: 'MW3',
            category: 'AR',
            stats: {
              damage: 80,
              range: 75,
              accuracy: 85,
              fireRate: 65,
              mobility: 70,
              control: 80,
              handling: 75,
            },
            meta: {
              tier: 'S',
            },
            ballistics: {
              fireRate: 800,
              magazineSize: 35,
            },
          },
        },
      ];

      const result = merger.mergeWeapons(weaponId, sources);

      expect(result.weapon).toBeDefined();
      const weapon = result.weapon;

      // No conflicts with single source
      expect(weapon.lineage.conflictCount).toBe(0);
      expect(weapon.stats.damage.hasConflict).toBe(false);
      expect(weapon.stats.damage.currentValue).toBe(80);

      // Single source tracked
      expect(weapon.lineage.totalSources).toBe(1);
      expect(weapon.lineage.contributingSources).toContain(DataSource.CODARMORY);
    });
  });

  describe('Test 4: Stale Data', () => {
    it('should handle stale data with reduced confidence', () => {
      const weaponId = 'test-weapon-004';
      const now = Date.now();
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000; // 30 days
      const sixtyDaysAgo = now - 60 * 24 * 60 * 60 * 1000; // 60 days

      const sources: SourcedWeaponData[] = [
        {
          source: DataSource.CODARMORY,
          timestamp: sixtyDaysAgo, // Very stale
          data: {
            name: 'RAM-7',
            game: 'MW3',
            category: 'AR',
            stats: {
              damage: 70,
              range: 65,
              accuracy: 75,
              fireRate: 60,
              mobility: 65,
              control: 70,
              handling: 65,
            },
            meta: { tier: 'B' },
            ballistics: {},
          },
        },
        {
          source: DataSource.WZSTATS,
          timestamp: thirtyDaysAgo, // Stale
          data: {
            name: 'RAM-7',
            game: 'MW3',
            category: 'AR',
            stats: {
              damage: 75,
              range: 68,
              accuracy: 78,
              fireRate: 62,
              mobility: 67,
              control: 72,
              handling: 67,
            },
            meta: { tier: 'A' },
            ballistics: {},
          },
        },
      ];

      const result = merger.mergeWeapons(weaponId, sources);

      expect(result.weapon).toBeDefined();
      const weapon = result.weapon;

      // Stale data should be counted
      expect(weapon.lineage.staleDataCount).toBeGreaterThan(0);

      // Confidence should be reduced for stale data
      expect(weapon.stats.damage.confidence.freshness).toBeLessThan(1.0);
    });
  });

  describe('Test 5: Missing Fields', () => {
    it('should create defaults for missing fields', () => {
      const weaponId = 'test-weapon-005';
      const now = Date.now();

      const sources: SourcedWeaponData[] = [
        {
          source: DataSource.CODARMORY,
          timestamp: now,
          data: {
            name: 'MTZ-556',
            game: 'MW3',
            category: 'AR',
            stats: {
              // Only partial stats
              damage: 72,
              range: 70,
            },
            meta: {
              // Only tier, missing other meta fields
              tier: 'B',
            },
            ballistics: {
              // Only fireRate
              fireRate: 700,
            },
          },
        },
      ];

      const result = merger.mergeWeapons(weaponId, sources);

      expect(result.weapon).toBeDefined();
      const weapon = result.weapon;

      // Verify all stat fields exist (even if with defaults)
      expect(weapon.stats.damage).toBeDefined();
      expect(weapon.stats.range).toBeDefined();
      expect(weapon.stats.accuracy).toBeDefined(); // Default
      expect(weapon.stats.fireRate).toBeDefined(); // Default
      expect(weapon.stats.mobility).toBeDefined(); // Default
      expect(weapon.stats.control).toBeDefined(); // Default
      expect(weapon.stats.handling).toBeDefined(); // Default

      // Verify defaults have zero confidence
      expect(weapon.stats.accuracy.confidence.value).toBe(0);
      expect(weapon.stats.accuracy.sources).toHaveLength(0);

      // Verify provided values have normal confidence
      expect(weapon.stats.damage.currentValue).toBe(72);
      expect(weapon.stats.damage.confidence.value).toBeGreaterThan(0);
    });
  });

  describe('Utility Functions', () => {
    describe('extractWeaponId', () => {
      it('should generate consistent MD5 hash IDs', () => {
        const data1 = { name: 'MCW', game: 'MW3' };
        const data2 = { name: 'MCW', game: 'MW3' };
        const data3 = { name: 'mcw', game: 'mw3' }; // Different case

        const id1 = extractWeaponId(data1, DataSource.CODARMORY);
        const id2 = extractWeaponId(data2, DataSource.WZSTATS);
        const id3 = extractWeaponId(data3, DataSource.CODMUNITY);

        // Same weapon should have same ID regardless of case
        expect(id1).toBe(id2);
        expect(id1).toBe(id3);

        // ID should be 32-char hex string (MD5)
        expect(id1).toMatch(/^[a-f0-9]{32}$/);
      });

      it('should generate different IDs for different weapons', () => {
        const data1 = { name: 'MCW', game: 'MW3' };
        const data2 = { name: 'SVA 545', game: 'MW3' };

        const id1 = extractWeaponId(data1, DataSource.CODARMORY);
        const id2 = extractWeaponId(data2, DataSource.CODARMORY);

        expect(id1).not.toBe(id2);
      });
    });

    describe('weaponsMatch', () => {
      it('should match weapons with same name and game', () => {
        const weapon1 = { name: 'MCW', game: 'MW3', category: 'AR' };
        const weapon2 = { name: 'MCW', game: 'MW3', category: 'AR' };

        expect(weaponsMatch(weapon1, weapon2)).toBe(true);
      });

      it('should normalize whitespace and case', () => {
        const weapon1 = { name: ' MCW  ', game: 'MW3' };
        const weapon2 = { name: 'mcw', game: 'mw3' };

        expect(weaponsMatch(weapon1, weapon2)).toBe(true);
      });

      it('should not match weapons with different names', () => {
        const weapon1 = { name: 'MCW', game: 'MW3' };
        const weapon2 = { name: 'SVA 545', game: 'MW3' };

        expect(weaponsMatch(weapon1, weapon2)).toBe(false);
      });

      it('should not match weapons from different games', () => {
        const weapon1 = { name: 'MCW', game: 'MW3' };
        const weapon2 = { name: 'MCW', game: 'WARZONE' };

        expect(weaponsMatch(weapon1, weapon2)).toBe(false);
      });
    });

    describe('mergeAttachments', () => {
      it('should deduplicate attachments across sources', () => {
        const sources = [
          {
            source: DataSource.CODARMORY,
            attachments: {
              optic: ['RedDot', 'Holo', 'ACOG'],
              barrel: ['Long', 'Short'],
            },
          },
          {
            source: DataSource.WZSTATS,
            attachments: {
              optic: ['RedDot', 'Holo', 'Thermal'], // RedDot and Holo duplicate
              barrel: ['Long', 'Suppressor'], // Long duplicate
              magazine: ['Extended', 'Drum'],
            },
          },
        ];

        const result = mergeAttachments(sources);

        expect(result.optic).toHaveLength(4); // RedDot, Holo, ACOG, Thermal
        expect(result.barrel).toHaveLength(3); // Long, Short, Suppressor
        expect(result.magazine).toHaveLength(2); // Extended, Drum

        // Should be sorted
        expect(result.optic).toEqual(['ACOG', 'Holo', 'RedDot', 'Thermal']);
      });

      it('should handle empty attachment sources', () => {
        const sources = [
          {
            source: DataSource.CODARMORY,
            attachments: {},
          },
        ];

        const result = mergeAttachments(sources);

        expect(result).toEqual({});
      });

      it('should handle invalid attachment data gracefully', () => {
        const sources = [
          {
            source: DataSource.CODARMORY,
            attachments: null as any,
          },
          {
            source: DataSource.WZSTATS,
            attachments: {
              optic: ['RedDot', null, '', 'Holo'] as any, // Invalid entries
            },
          },
        ];

        const result = mergeAttachments(sources);

        expect(result.optic).toEqual(['Holo', 'RedDot']); // Only valid strings
      });
    });
  });

  describe('Error Handling', () => {
    it('should throw error when no sources provided', () => {
      expect(() => {
        merger.mergeWeapons('test', []);
      }).toThrow('No sources provided for merging');
    });

    it('should handle malformed source data gracefully', () => {
      const sources: SourcedWeaponData[] = [
        {
          source: DataSource.UNKNOWN,
          timestamp: Date.now(),
          data: {
            // Missing required fields
            stats: {},
          },
        },
      ];

      const result = merger.mergeWeapons('test', sources);

      // Should succeed with defaults
      expect(result.weapon).toBeDefined();
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Configuration', () => {
    it('should respect minConfidenceThreshold config', () => {
      const strictMerger = new SchemaMerger({
        minConfidenceThreshold: 0.8, // Very high threshold
      });

      const now = Date.now();
      const sources: SourcedWeaponData[] = [
        {
          source: DataSource.USER_SUBMISSION, // Low reliability
          timestamp: now - 86400000 * 60, // 60 days old
          data: {
            name: 'Test',
            game: 'MW3',
            category: 'AR',
            stats: { damage: 50 },
            meta: {},
            ballistics: {},
          },
        },
      ];

      const result = strictMerger.mergeWeapons('test', sources);

      // Low confidence sources should still be included (just noted)
      expect(result.weapon).toBeDefined();
    });

    it('should allow config updates', () => {
      const initialConfig = merger.getConfig();
      expect(initialConfig.minConfidenceThreshold).toBe(0.3);

      merger.updateConfig({ minConfidenceThreshold: 0.5 });

      const updatedConfig = merger.getConfig();
      expect(updatedConfig.minConfidenceThreshold).toBe(0.5);
    });
  });
});
