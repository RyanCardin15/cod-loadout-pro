/**
 * Data validation utilities
 * Ensures data quality before writing to Firestore
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate weapon data
 */
export function validateWeapon(weapon: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!weapon.name || weapon.name.trim() === '') {
    errors.push('Weapon name is required');
  }

  if (!weapon.game || weapon.game.trim() === '') {
    errors.push('Game is required');
  }

  if (!weapon.category || weapon.category.trim() === '') {
    errors.push('Category is required');
  }

  // Validate stats if present
  if (weapon.stats) {
    const stats = weapon.stats;

    // Check stat ranges (0-100)
    const statKeys = ['damage', 'range', 'accuracy', 'fireRate', 'mobility', 'control', 'handling'];

    for (const key of statKeys) {
      if (stats[key] !== undefined) {
        if (typeof stats[key] !== 'number') {
          errors.push(`${key} must be a number`);
        } else if (stats[key] < 0 || stats[key] > 100) {
          errors.push(`${key} must be between 0-100 (got ${stats[key]})`);
        }
      }
    }

    // Warn if all stats are 0
    const allZero = statKeys.every(key => stats[key] === 0);
    if (allZero) {
      warnings.push('All weapon stats are 0');
    }
  } else {
    warnings.push('No stats provided for weapon');
  }

  // Validate meta if present
  if (weapon.meta) {
    if (weapon.meta.tier && !['S', 'A', 'B', 'C', 'D'].includes(weapon.meta.tier)) {
      errors.push(`Invalid tier: ${weapon.meta.tier}`);
    }

    if (weapon.meta.popularity !== undefined) {
      if (weapon.meta.popularity < 0 || weapon.meta.popularity > 100) {
        errors.push(`Popularity must be 0-100 (got ${weapon.meta.popularity})`);
      }
    }

    if (weapon.meta.winRate !== undefined) {
      if (weapon.meta.winRate < 0 || weapon.meta.winRate > 100) {
        errors.push(`Win rate must be 0-100 (got ${weapon.meta.winRate})`);
      }
    }
  }

  // Validate ballistics if present
  if (weapon.ballistics) {
    if (weapon.ballistics.ttk) {
      if (weapon.ballistics.ttk.min <= 0) {
        errors.push('TTK min must be greater than 0');
      }
      if (weapon.ballistics.ttk.max < weapon.ballistics.ttk.min) {
        errors.push('TTK max must be greater than or equal to min');
      }
    }

    if (weapon.ballistics.fireRate !== undefined && weapon.ballistics.fireRate <= 0) {
      errors.push('Fire rate must be greater than 0');
    }

    if (weapon.ballistics.magazineSize !== undefined && weapon.ballistics.magazineSize <= 0) {
      errors.push('Magazine size must be greater than 0');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate attachment data
 */
export function validateAttachment(attachment: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!attachment.name || attachment.name.trim() === '') {
    errors.push('Attachment name is required');
  }

  if (!attachment.slot || attachment.slot.trim() === '') {
    errors.push('Slot is required');
  }

  // Validate slot is valid
  const validSlots = ['optic', 'barrel', 'magazine', 'underbarrel', 'stock', 'laser', 'muzzle', 'rearGrip', 'ammunition', 'perk', 'other'];
  if (attachment.slot && !validSlots.includes(attachment.slot)) {
    warnings.push(`Unusual slot: ${attachment.slot}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate meta snapshot data
 */
export function validateMetaSnapshot(snapshot: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!snapshot.game || snapshot.game.trim() === '') {
    errors.push('Game is required');
  }

  if (!snapshot.date) {
    errors.push('Date is required');
  }

  if (!snapshot.tiers) {
    errors.push('Tiers are required');
  } else {
    // Validate tier structure
    const expectedTiers = ['S', 'A', 'B', 'C', 'D'];
    for (const tier of expectedTiers) {
      if (!Array.isArray(snapshot.tiers[tier])) {
        errors.push(`Tier ${tier} must be an array`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Detect stat anomalies
 * Returns true if stats changed suspiciously
 */
export function detectStatAnomalies(oldStats: any, newStats: any, threshold = 50): string[] {
  const anomalies: string[] = [];

  if (!oldStats || !newStats) {
    return anomalies;
  }

  const statKeys = ['damage', 'range', 'accuracy', 'fireRate', 'mobility', 'control', 'handling'];

  for (const key of statKeys) {
    if (oldStats[key] !== undefined && newStats[key] !== undefined) {
      const diff = Math.abs(newStats[key] - oldStats[key]);

      if (diff > threshold) {
        anomalies.push(`${key} changed by ${diff}% (${oldStats[key]} → ${newStats[key]})`);
      }
    }
  }

  return anomalies;
}

/**
 * Sanitize weapon name
 * Removes special characters, normalizes spacing
 */
export function sanitizeWeaponName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, ' ') // Normalize multiple spaces
    .replace(/[^\w\s-]/g, '') // Remove special chars except dash
    .trim();
}

/**
 * Normalize game name
 */
export function normalizeGameName(game: string): string {
  const gameMap: Record<string, string> = {
    'mw3': 'MW3',
    'modernwarfare3': 'MW3',
    'modern warfare 3': 'MW3',
    'warzone': 'Warzone',
    'wz': 'Warzone',
    'bo6': 'BO6',
    'blackops6': 'BO6',
    'black ops 6': 'BO6',
    'mw2': 'MW2',
    'modernwarfare2': 'MW2',
    'modern warfare 2': 'MW2',
  };

  const normalized = game.toLowerCase().replace(/\s+/g, '');
  return gameMap[normalized] || game.toUpperCase();
}
