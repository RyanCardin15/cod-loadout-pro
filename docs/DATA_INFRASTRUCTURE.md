# Data Infrastructure Guide

## Overview

Counterplay uses a multi-source data pipeline to gather weapon stats, meta rankings, and loadout information from various Call of Duty data providers.

### Implementation Status

**✅ Fully Implemented:**
- Deterministic ID generation for duplicate prevention
- Upsert logic for safe data updates
- Data validation and sanitization
- Duplicate cleanup scripts
- CODArmory data fetching
- Rate limiting and caching infrastructure
- GitHub Actions automation
- Health monitoring system

**⚠️ Partially Implemented:**
- WZStats.gg scraper (infrastructure ready, needs HTML parsing)
- CODMunity scraper (infrastructure ready, needs HTML/API analysis)

**📋 Planned:**
- TrueGameData scraper
- sym.gg API integration
- Advanced meta analysis

## Data Sources

### 1. CODArmory (Primary - Active)
- **Type**: GitHub Repository (Static JSON)
- **URL**: https://github.com/tzurbaev/codarmory.com
- **Data**: Weapons, attachments, base stats
- **Update Frequency**: Weekly
- **Status**: ✅ Fully Implemented

### 2. WZStats.gg (Secondary - Placeholder)
- **Type**: HTML Scraping / API
- **URL**: https://wzstats.gg
- **Data**: Live meta tiers, weapon usage %, win rates
- **Update Frequency**: Daily
- **Status**: ⚠️ Infrastructure Ready (needs HTML analysis)

### 3. CODMunity (Secondary - Placeholder)
- **Type**: HTML Scraping / API
- **URL**: https://codmunity.gg
- **Data**: TTK, bullet velocity, damage profiles
- **Update Frequency**: Weekly
- **Status**: ⚠️ Infrastructure Ready (needs HTML/API analysis)

### 4. TrueGameData (Future)
- **Type**: HTML Scraping
- **URL**: https://truegamedata.com
- **Data**: Recoil patterns, ADS times, movement speeds
- **Status**: 📋 Planned

### 5. sym.gg (Future)
- **Type**: API Reverse Engineering
- **URL**: https://sym.gg
- **Data**: Attachment stat modifiers, exact damage ranges
- **Status**: 📋 Planned

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Data Collection Layer                    │
├─────────────────────────────────────────────────────────────┤
│  CODArmory  │  WZStats  │  CODMunity  │  TrueGameData  │... │
│   (GitHub)  │  (HTML)   │   (HTML)    │     (HTML)     │    │
└──────┬──────┴─────┬─────┴──────┬──────┴────────┬────────┴────┘
       │            │            │               │
       ├────────────┼────────────┼───────────────┘
       │            │            │
┌──────▼────────────▼────────────▼──────┐
│       Rate Limiter & Cache Layer       │
│  • GitHub: 60/min, 5000/hour          │
│  • WZStats: 30/min                    │
│  • CODMunity: 30/min                  │
│  • Cache: 7-day TTL (file-based)      │
└──────┬─────────────────────────────────┘
       │
┌──────▼─────────────────────────────────┐
│       Transformation Layer             │
│  • Normalize weapon names              │
│  • Merge stats from multiple sources   │
│  • Calculate composite tiers           │
│  • Validate data integrity             │
└──────┬─────────────────────────────────┘
       │
┌──────▼─────────────────────────────────┐
│       Storage Layer (Firestore)        │
│  Collections:                          │
│  • weapons (230+ docs)                 │
│  • attachments (1500+ docs)            │
│  • loadouts (user-generated)           │
│  • meta_snapshots (historical)         │
└────────────────────────────────────────┘
```

## Duplicate Prevention

### Problem
Previous implementation created new documents on every sync, leading to thousands of duplicates.

### Solution
**Deterministic IDs** using composite keys:

```typescript
// Weapons: MD5(name + game)
weaponId = hash("M4A1" + "MW3") = "a1b2c3d4..."

// Attachments: MD5(name + slot)
attachmentId = hash("Reflex Sight" + "optic") = "e5f6g7h8..."
```

**Upsert Logic**:
```typescript
const ref = db().collection('weapons').doc(weaponId);
const existing = await ref.get();

if (existing.exists) {
  await ref.update({ ...data, updatedAt: now });
} else {
  await ref.set({ ...data, createdAt: now });
}
```

## Scripts

### Production Scripts

| Command | Description | Frequency |
|---------|-------------|-----------|
| `npm run data:init` | Initial database population | Once |
| `npm run data:sync` | Sync weapons/attachments (upsert) | Weekly |
| `npm run data:update` | Update meta rankings only | Daily |
| `npm run data:cleanup` | Remove duplicate records | As needed |
| `npm run data:health` | Check data source health | Monitoring |
| `npm run data:test` | Test data infrastructure | Development |

### Development Scripts

```bash
# Populate database (first time)
npm run data:init

# Update meta rankings
npm run data:update

# Sync latest weapons (safe - uses upsert)
npm run data:sync

# Clean up duplicates from old system
npm run data:cleanup

# Check health of all data sources
npm run data:health

# Test data connections
npm run data:test
```

## Automation

### GitHub Actions

**Daily Meta Update** (`.github/workflows/daily-meta-update.yml`)
- **Schedule**: 2 AM UTC daily
- **Action**: Update weapon tier rankings, popularity, win rates
- **Duration**: ~2 minutes
- **Triggers**: Cron schedule or manual dispatch

**Weekly Data Sync** (`.github/workflows/weekly-data-sync.yml`)
- **Schedule**: Sunday 3 AM UTC
- **Action**: Sync weapons/attachments, update meta
- **Duration**: ~5 minutes
- **Triggers**: Cron schedule or manual dispatch

### Required Secrets

Configure in GitHub Settings > Secrets:

```
FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY
FIREBASE_STORAGE_BUCKET
```

## Caching Strategy

**File-Based Cache** (`.cache/`)
- Location: `{project}/.cache/*.json`
- TTL: 7 days for weapons, 2 hours for meta
- Auto-cleanup: Expired entries deleted on read
- Gitignored: ✅

**Benefits**:
- Reduces API calls (respects rate limits)
- Faster development iteration
- Persists across script runs

**Cache Commands**:
```bash
# View cache stats
cat .cache/*.json | wc -l

# Clear cache
rm -rf .cache/

# Check cache size
du -sh .cache/
```

## Rate Limiting

Pre-configured limits per source:

| Source | Per Minute | Per Hour |
|--------|------------|----------|
| GitHub | 60 | 5000 |
| WZStats | 30 | - |
| CODMunity | 30 | - |
| TrueGameData | 10 | - |
| sym.gg | 20 | - |

**Queue System**:
- Requests queued and processed serially
- Automatic delays when limits reached
- Logging: `⏳ Rate limit: waiting 45s...`

## Data Validation

### Schema Validation (✅ Implemented)

All weapon and attachment data is validated before writing to Firestore using `scripts/lib/utils/data-validator.ts`:

```typescript
// Weapon validation
const validation = validateWeapon(weapon);
if (!validation.valid) {
  console.error(`Skipping ${weapon.name}: ${validation.errors.join(', ')}`);
  skippedCount++;
  continue;
}

// Checks performed:
// - Required fields (name, game, category)
// - Stat ranges (0-100 for damage, range, accuracy, etc.)
// - Tier validation (S/A/B/C/D)
// - Popularity/win rate ranges (0-100)
// - TTK/fire rate/magazine size validation
```

### Data Sanitization (✅ Implemented)

```typescript
// Normalize weapon names
weapon.name = sanitizeWeaponName(weapon.name);
// - Trims whitespace
// - Normalizes multiple spaces
// - Removes special characters except dashes

// Normalize game names
weapon.game = normalizeGameName(weapon.game);
// - Maps variations: "mw3", "modernwarfare3" → "MW3"
// - Handles: MW2, MW3, BO6, Warzone
```

### Anomaly Detection (✅ Implemented)

```typescript
// Detect sudden stat changes
const anomalies = detectStatAnomalies(oldStats, newStats, threshold);
// Warns if any stat changes > 50% between updates
// Example: "damage changed by 60% (70 → 10)"
```

### Validation Results

During population, validation provides:
- **Error count**: Invalid data automatically skipped
- **Warning count**: Suspicious but valid data logged
- **Skip count**: Items that failed validation
- **Success/Update count**: Valid items processed

## Implementation Guide

### Adding a New Data Source

1. **Create Scraper** (`scripts/lib/scrapers/{source}-scraper.ts`)
```typescript
import { rateLimiters } from '../utils/rate-limiter';
import { cache } from '../utils/cache';

export async function fetchSourceData() {
  return cache.cached('source-key', async () => {
    return rateLimiters.source.execute(() => {
      // Fetch and parse data
    });
  }, cacheTTL);
}
```

2. **Add Rate Limiter** (`scripts/lib/utils/rate-limiter.ts`)
```typescript
export const rateLimiters = {
  // ...
  newsource: new RateLimiter({ requestsPerMinute: 30 }),
};
```

3. **Create Transformer** (`scripts/lib/transformers/{source}-transformer.ts`)
```typescript
export function transformSourceWeapon(raw: any): Weapon {
  return {
    name: raw.weaponName || raw.name,
    game: normalizeGame(raw.game),
    // ...
  };
}
```

4. **Integrate into Sync** (`scripts/populate-initial-data.ts`)
```typescript
import { fetchSourceData } from './lib/scrapers/source-scraper';
import { transformSourceWeapon } from './lib/transformers/source-transformer';

// In populateWeapons():
const sourceData = await fetchSourceData();
for (const item of sourceData) {
  const weapon = transformSourceWeapon(item);
  // Upsert to Firestore
}
```

5. **Test**
```bash
npm run data:test
npm run data:sync
```

## Troubleshooting

### Issue: "Firebase not initialized"
**Solution**: Check `.env` file has all Firebase credentials

### Issue: "Rate limit exceeded"
**Solution**: Increase delay in `rate-limiter.ts` or reduce batch size

### Issue: "Duplicate weapons still appearing"
**Solution**: Run `npm run data:cleanup` to migrate to canonical IDs

### Issue: "Cache not working"
**Solution**: Check `.cache/` directory exists and is writable

### Issue: "Scraper returns empty array"
**Solution**:
1. Check website hasn't changed HTML structure
2. Verify User-Agent header is set
3. Test with `curl` to see actual response

## Future Enhancements

- [ ] **Puppeteer/Playwright** for dynamic content
- [ ] **Data versioning** track stat changes over time
- [ ] **Webhook notifications** for major meta shifts
- [ ] **Image uploads** weapon/attachment images to Firebase Storage
- [ ] **Redis caching** for production (replace file cache)
- [ ] **Vercel Cron Jobs** as alternative to GitHub Actions
- [ ] **GraphQL API** for flexible data queries
- [ ] **Real-time sync** via Firestore listeners

## Monitoring

### Health Check (✅ Implemented)

Run `npm run data:health` to check all infrastructure components:

```bash
npm run data:health

# Output:
🏥 Data Infrastructure Health Check
============================================================

✅ CODArmory (GitHub)        HEALTHY
   ⏱️  Latency: 391ms
   📊 repository: https://github.com/tzurbaev/codarmory.com

⚠️ WZStats.gg                DEGRADED
   ⏱️  Latency: 449ms
   📊 httpStatus: 200
   📊 note: Scraper not yet implemented

✅ Firestore                 HEALTHY
   ⏱️  Latency: 416ms
   📊 weapons: 99
   📊 attachments: 2451

✅ File Cache                HEALTHY
   ⏱️  Latency: 186ms
   📊 files: 3
   📊 sizeKB: 776.98

✅ Data Freshness            HEALTHY
   📊 lastUpdate: 2025-10-08T00:13:14.635Z
   📊 hoursSinceUpdate: 0.1
```

**Health Statuses:**
- ✅ **Healthy**: System operational
- ⚠️ **Degraded**: Working but limited (e.g., scraper not implemented)
- ❌ **Down**: System unavailable

**Exit codes:**
- `0`: All critical systems healthy
- `1`: Critical system down (CODArmory or Firestore)

### Logs

GitHub Actions logs available at:
```
https://github.com/{owner}/{repo}/actions
```

### Metrics to Track

- **Sync Success Rate**: % of successful runs
- **Data Freshness**: Time since last update (tracked by health check)
- **Duplicate Count**: Should be 0 after cleanup
- **Cache Hit Rate**: % of requests served from cache
- **Source Availability**: Uptime of data sources (tracked by health check)
- **Health Score**: Overall system health percentage

## License & Terms

**Important**: Respect terms of service for all data sources:
- Don't overload servers (use rate limiting)
- Cache aggressively to reduce requests
- Provide attribution where required
- Consider reaching out for official API access
