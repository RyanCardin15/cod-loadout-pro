/**
 * XSS Sanitization utilities
 *
 * Provides comprehensive protection against Cross-Site Scripting (XSS) attacks
 * by sanitizing user-generated content before storage and display.
 *
 * This module uses DOMPurify for robust HTML sanitization with strict
 * configuration to prevent XSS attacks while preserving legitimate content.
 *
 * Key features:
 * - Strict sanitization (removes all HTML by default)
 * - Relaxed mode for basic formatting tags
 * - Recursive object sanitization
 * - XSS pattern detection and logging
 * - Domain-specific sanitization (loadouts, etc.)
 *
 * @module security/sanitize
 */

// ============================================================================
// DOMPurify Lazy Loading
// ============================================================================

/**
 * DOMPurify instance cache
 * Lazy-loaded to avoid issues during Next.js build time
 */
let DOMPurifyInstance: typeof import('isomorphic-dompurify').default | null =
  null;

/**
 * Gets or initializes the DOMPurify instance
 *
 * @returns DOMPurify instance for HTML sanitization
 */
function getDOMPurify(): typeof import('isomorphic-dompurify').default {
  if (!DOMPurifyInstance) {
    DOMPurifyInstance = require('isomorphic-dompurify');
  }
  return DOMPurifyInstance!;
}

// ============================================================================
// Configuration
// ============================================================================

/**
 * DOMPurify configuration for strict sanitization
 *
 * This is the default and most secure configuration.
 * Removes ALL HTML tags while preserving text content.
 *
 * Use this for:
 * - User-generated names
 * - Descriptions
 * - Any untrusted input
 */
const SANITIZE_CONFIG = {
  ALLOWED_TAGS: [], // No HTML tags allowed - plain text only
  ALLOWED_ATTR: [], // No attributes allowed
  KEEP_CONTENT: true, // Keep text content, remove tags
  RETURN_DOM: false, // Return string, not DOM
  RETURN_DOM_FRAGMENT: false, // Return string, not DOM fragment
};

/**
 * Relaxed DOMPurify configuration for limited formatting
 *
 * Allows basic formatting tags for enhanced readability.
 * Still removes dangerous tags and attributes.
 *
 * Allowed tags: b, i, em, strong, br
 *
 * Use this for:
 * - Long-form content where formatting improves readability
 * - User-controlled descriptions with basic formatting
 */
const SANITIZE_CONFIG_RELAXED = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br'],
  ALLOWED_ATTR: [], // Still no attributes allowed
  KEEP_CONTENT: true, // Keep text content
  RETURN_DOM: false, // Return string
  RETURN_DOM_FRAGMENT: false, // Return string
};

// ============================================================================
// XSS Detection Patterns
// ============================================================================

/**
 * Suspicious patterns that may indicate XSS attempts
 *
 * These regular expressions detect common XSS attack vectors.
 * Used for detection and logging, not for sanitization.
 */
const XSS_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi, // Script tags
  /javascript:/gi, // JavaScript protocol
  /on\w+\s*=/gi, // Event handlers (onclick, onerror, onload, etc.)
  /<iframe/gi, // Iframe injection
  /<embed/gi, // Embed injection
  /<object/gi, // Object injection
  /eval\(/gi, // Eval calls
  /expression\(/gi, // CSS expression
  /vbscript:/gi, // VBScript protocol
  /data:text\/html/gi, // Data URI HTML
];

// ============================================================================
// Core Sanitization Functions
// ============================================================================

/**
 * Sanitizes a single string value
 *
 * This is the core sanitization function for all user input.
 * Removes all HTML tags and potentially dangerous content while preserving
 * the text content.
 *
 * Security guarantees:
 * - Removes all script tags
 * - Removes event handlers
 * - Removes dangerous protocols (javascript:, vbscript:, etc.)
 * - Preserves text content
 *
 * @param value - The string to sanitize
 * @param relaxed - If true, allows basic formatting tags (b, i, em, strong, br)
 * @returns Sanitized string (empty string if input is not a string)
 *
 * @example
 * ```typescript
 * // Strict mode (default):
 * sanitizeUserInput('<script>alert("xss")</script>Hello');
 * // Returns: 'Hello'
 *
 * sanitizeUserInput('Hello <b>World</b>');
 * // Returns: 'Hello World'
 *
 * // Relaxed mode:
 * sanitizeUserInput('Hello <b>World</b>', true);
 * // Returns: 'Hello <b>World</b>'
 *
 * sanitizeUserInput('Click <a href="javascript:alert()">here</a>', true);
 * // Returns: 'Click here' (dangerous tags still removed)
 * ```
 */
export function sanitizeUserInput(value: string, relaxed = false): string {
  if (typeof value !== 'string') {
    return '';
  }

  const DOMPurify = getDOMPurify();
  const config = relaxed ? SANITIZE_CONFIG_RELAXED : SANITIZE_CONFIG;
  return DOMPurify.sanitize(value.trim(), config);
}

/**
 * Sanitizes all string values in an object recursively
 *
 * This function traverses the entire object tree and sanitizes all string
 * values while preserving the object structure. Handles nested objects
 * and arrays.
 *
 * Non-string values (numbers, booleans, etc.) are passed through unchanged.
 *
 * @template T - The object type
 * @param obj - The object to sanitize
 * @param relaxed - If true, allows basic formatting tags in all string values
 * @returns New object with sanitized string values (original object unchanged)
 *
 * @example
 * ```typescript
 * const input = {
 *   name: '<script>alert("xss")</script>John',
 *   age: 25,
 *   nested: {
 *     description: 'Hello <b>World</b>',
 *     items: ['<script>bad</script>Item 1', 'Item 2']
 *   }
 * };
 *
 * sanitizeObject(input);
 * // Returns: {
 * //   name: 'John',
 * //   age: 25,
 * //   nested: {
 * //     description: 'Hello World',
 * //     items: ['Item 1', 'Item 2']
 * //   }
 * // }
 * ```
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  relaxed = false
): T {
  const sanitized: any = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      // Sanitize string values
      sanitized[key] = sanitizeUserInput(value, relaxed);
    } else if (Array.isArray(value)) {
      // Recursively sanitize array items
      sanitized[key] = value.map((item) =>
        typeof item === 'string'
          ? sanitizeUserInput(item, relaxed)
          : typeof item === 'object' && item !== null
            ? sanitizeObject(item, relaxed)
            : item
      );
    } else if (typeof value === 'object' && value !== null) {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeObject(value, relaxed);
    } else {
      // Pass through non-string primitives (numbers, booleans, null, undefined)
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}

// ============================================================================
// Domain-Specific Sanitization
// ============================================================================

/**
 * Sanitizes loadout data with appropriate rules for each field
 *
 * Applies comprehensive field-specific sanitization rules to loadout data.
 * This is the primary sanitization function for user-created loadouts.
 *
 * Sanitization rules:
 * - Name: Strict (no HTML)
 * - Game, playstyle: Strict (no HTML)
 * - Effective range, difficulty: Strict (no HTML)
 * - Weapons: Recursive sanitization
 * - Attachments: Recursive sanitization
 * - Perks: Strict (no HTML)
 * - Equipment: Strict (no HTML)
 *
 * @param loadout - The loadout data to sanitize (can be partial)
 * @returns Sanitized loadout data with same structure
 */
export function sanitizeLoadout(loadout: any): any {
  const sanitized: any = {
    ...loadout,
    name: sanitizeUserInput(loadout.name || ''),
    game: sanitizeUserInput(loadout.game || ''),
    playstyle: sanitizeUserInput(loadout.playstyle || ''),
    effectiveRange: loadout.effectiveRange
      ? sanitizeUserInput(loadout.effectiveRange)
      : undefined,
    difficulty: loadout.difficulty
      ? sanitizeUserInput(loadout.difficulty)
      : undefined,
  };

  // Sanitize primary weapon
  if (loadout.primary) {
    sanitized.primary = {
      weapon: loadout.primary.weapon
        ? sanitizeObject(loadout.primary.weapon)
        : undefined,
      attachments: Array.isArray(loadout.primary.attachments)
        ? loadout.primary.attachments.map((att: any) => sanitizeObject(att))
        : [],
    };
  }

  // Sanitize secondary weapon if present
  if (loadout.secondary) {
    sanitized.secondary = {
      weapon: loadout.secondary.weapon
        ? sanitizeObject(loadout.secondary.weapon)
        : undefined,
      attachments: Array.isArray(loadout.secondary.attachments)
        ? loadout.secondary.attachments.map((att: any) => sanitizeObject(att))
        : [],
    };
  }

  // Sanitize perks (all optional fields)
  if (loadout.perks) {
    sanitized.perks = {
      perk1: loadout.perks.perk1
        ? sanitizeUserInput(loadout.perks.perk1)
        : undefined,
      perk2: loadout.perks.perk2
        ? sanitizeUserInput(loadout.perks.perk2)
        : undefined,
      perk3: loadout.perks.perk3
        ? sanitizeUserInput(loadout.perks.perk3)
        : undefined,
      perk4: loadout.perks.perk4
        ? sanitizeUserInput(loadout.perks.perk4)
        : undefined,
    };
  }

  // Sanitize equipment (all optional fields)
  if (loadout.equipment) {
    sanitized.equipment = {
      lethal: loadout.equipment.lethal
        ? sanitizeUserInput(loadout.equipment.lethal)
        : undefined,
      tactical: loadout.equipment.tactical
        ? sanitizeUserInput(loadout.equipment.tactical)
        : undefined,
      fieldUpgrade: loadout.equipment.fieldUpgrade
        ? sanitizeUserInput(loadout.equipment.fieldUpgrade)
        : undefined,
    };
  }

  return sanitized;
}

// ============================================================================
// XSS Detection
// ============================================================================

/**
 * Detects potential XSS attempts in a string
 *
 * Scans for common XSS patterns without modifying the input.
 * This is used for logging and security monitoring, not for sanitization.
 *
 * Detection is performed before sanitization to log potential attack attempts
 * even if they are successfully blocked.
 *
 * @param value - The string to check for XSS patterns
 * @returns Object with detection results and matched patterns
 *
 * @example
 * ```typescript
 * const result = detectXSSAttempt('<script>alert("xss")</script>');
 * // Returns: { detected: true, patterns: ['<script[^>]*>.*?<\\/script>'] }
 *
 * const safe = detectXSSAttempt('Hello World');
 * // Returns: { detected: false, patterns: [] }
 * ```
 */
export function detectXSSAttempt(value: string): {
  detected: boolean;
  patterns: string[];
} {
  if (typeof value !== 'string') {
    return { detected: false, patterns: [] };
  }

  const foundPatterns: string[] = [];

  for (const pattern of XSS_PATTERNS) {
    if (pattern.test(value)) {
      foundPatterns.push(pattern.source);
    }
  }

  return {
    detected: foundPatterns.length > 0,
    patterns: foundPatterns,
  };
}

/**
 * Detects XSS attempts in an object's string values
 *
 * Recursively scans all string values in an object for XSS patterns.
 * Returns detailed results showing which fields contain suspicious content.
 *
 * @param obj - The object to check for XSS patterns
 * @returns Detection results with field-level details
 *
 * @example
 * ```typescript
 * const data = {
 *   name: 'John',
 *   bio: '<script>alert("xss")</script>',
 *   nested: {
 *     description: 'Safe content'
 *   }
 * };
 *
 * const result = detectXSSInObject(data);
 * // Returns: {
 * //   detected: true,
 * //   fields: [
 * //     { field: 'bio', patterns: ['<script[^>]*>.*?<\\/script>'] }
 * //   ]
 * // }
 * ```
 */
export function detectXSSInObject(obj: Record<string, any>): {
  detected: boolean;
  fields: Array<{ field: string; patterns: string[] }>;
} {
  const detections: Array<{ field: string; patterns: string[] }> = [];

  function checkValue(value: any, path: string): void {
    if (typeof value === 'string') {
      const result = detectXSSAttempt(value);
      if (result.detected) {
        detections.push({ field: path, patterns: result.patterns });
      }
    } else if (Array.isArray(value)) {
      value.forEach((item, index) =>
        checkValue(item, `${path}[${index}]`)
      );
    } else if (typeof value === 'object' && value !== null) {
      for (const [key, val] of Object.entries(value)) {
        checkValue(val, path ? `${path}.${key}` : key);
      }
    }
  }

  checkValue(obj, '');

  return {
    detected: detections.length > 0,
    fields: detections,
  };
}
