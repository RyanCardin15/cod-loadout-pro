# Counterplay Data Strategy & Implementation Guide

## 📊 Overview

This document outlines the complete data strategy for the Counterplay application, including data sources, population methods, update strategies, and maintenance procedures.

---

## 🎯 Data Requirements

### 1. Weapons Database
- **Quantity**: ~100-150 weapons across all supported games
- **Games**: MW3, Warzone, BO6, MW2
- **Categories**: AR, SMG, LMG, Sniper, Marksman, Shotgun, Pistol

**Required Fields**:
- Basic stats (damage, range, accuracy, fire rate, mobility, control, handling)
- Ballistics (damage ranges, TTK, magazine size, reload time, ADS time)
- Attachment slots and compatibility
- Meta information (tier, popularity, win rate)
- Images and icons

### 2. Attachments Database
- **Quantity**: ~200-400 attachments
- **Types**: Optics, Barrels, Magazines, Underbarrels, Stocks, Lasers, Muzzles, Grips

**Required Fields**:
- Stat modifications (effects on weapon performance)
- Weapon compatibility
- Pros and cons
- Images

### 3. Meta Data
- **Update Frequency**: Daily
- **Coverage**: Tier lists, popularity rankings, balance changes, pro loadouts

### 4. Supporting Data
- **Perks**: ~30-50 perks per game
- **Equipment**: ~20-30 items (lethal, tactical, field upgrades)

---

## 🔍 Data Sources (Priority Order)

### Primary: CODArmory GitHub Repository ⭐
**URL**: https://github.com/tzurbaev/codarmory.com

**What it provides**:
- Complete weapons database (MW3, MW2, Warzone)
- Attachments with stat modifications
- Auto-generated JSON files
- Community-maintained, regularly updated

**Implementation Status**: ✅ **IMPLEMENTED**
- Script: `scripts/populate-initial-data.ts`
- Fetcher: `scripts/lib/scrapers/codarmory-fetcher.ts`
- Transformer: `scripts/lib/transformers/codarmory-transformer.ts`

**Usage**:
```bash
npm run data:init
```

### Secondary: Meta Tracking Sites

#### WZRanked.com
- **Data**: Tier lists, pick rates, win rates
- **Status**: ⏳ TODO - Implement scraper
- **Method**: Puppeteer (JavaScript-heavy site)

#### TrueGameData.com
- **Data**: Accurate ballistics, TTK, DPS
- **Status**: ⏳ TODO - Implement scraper
- **Note**: Check ToS before scraping

#### CODMunity.gg
- **Data**: Pro player loadouts, creator builds
- **Status**: ⏳ TODO - Implement scraper
- **Method**: Cheerio (static HTML parsing)

#### Sym.gg
- **Data**: Weapon stats, damage profiles
- **Status**: ⏳ TODO - Implement scraper

---

## 📁 File Structure

```
Counterplay/
├── scripts/
│   ├── populate-initial-data.ts       # ✅ Initial data population
│   ├── scrape-meta.ts                 # ⏳ Meta data updates
│   ├── seed-database.ts               # ✅ Sample data seeding
│   └── lib/
│       ├── scrapers/
│       │   ├── codarmory-fetcher.ts   # ✅ CODArmory API
│       │   ├── wzranked-scraper.ts    # ⏳ TODO
│       │   ├── truegamedata-scraper.ts # ⏳ TODO
│       │   └── codmunity-scraper.ts   # ⏳ TODO
│       ├── transformers/
│       │   └── codarmory-transformer.ts # ✅ Data transformation
│       └── utils/
│           ├── rate-limiter.ts        # ✅ API rate limiting
│           └── cache.ts               # ✅ File-based caching
```

---

## 🚀 Quick Start

### Step 1: Initial Data Population

Populate weapons and attachments from CODArmory:

```bash
npm run data:init
```

This will:
1. Fetch weapons and attachments from CODArmory GitHub
2. Transform data to match our schema
3. Upload to Firestore
4. Create initial meta snapshot
5. Cache data for 7 days

**Expected Output**:
- ~50-100 weapons added
- ~200+ attachments added
- Initial meta snapshot created

### Step 2: Update Meta Data

Update meta rankings and tier lists:

```bash
npm run update:meta
```

Currently uses mock data. TODO: Implement real scraping.

### Step 3: Verify Data

Check Firestore console to verify data:
- https://console.firebase.google.com/project/counterplay/firestore

---

## 🔄 Data Update Strategy

### Daily Updates (Automated)
**What**: Meta data, tier lists, popularity rankings

**Schedule**: Every day at 12:00 UTC

**Implementation**:
```yaml
# .github/workflows/update-meta.yml
name: Update Meta Data
on:
  schedule:
    - cron: '0 12 * * *'
```

**Script**: `npm run update:meta`

### Weekly Full Sync
**What**: Complete weapons and attachments resync

**Schedule**: Every Monday at 00:00 UTC

**Script**: `npm run data:sync`

### Patch Day Updates
**When**: New COD patch or balance update

**Trigger**: Manual or automated detection

**Process**:
1. Clear cache: `cache.clear()`
2. Re-fetch CODArmory data
3. Update meta data
4. Create new meta snapshot

---

## 🛠️ Utility Scripts

### Clear Cache
```bash
npm run cache:clear
```

### Test Data Sources
```bash
npm run data:test
```

### View Cache Stats
```bash
npm run cache:stats
```

---

## 📊 Data Validation

All data goes through validation before being stored:

```typescript
// Validation checks:
✓ Required fields present
✓ Stats within range (0-100)
✓ Valid game/category values
✓ Image URLs accessible
✓ TTK calculations match damage profiles
```

**Validation Logs**:
- Warnings for missing optional fields
- Errors for invalid data
- Auto-correction for out-of-range values

---

## 💾 Caching Strategy

### File-Based Cache
- **Location**: `.cache/` directory
- **Format**: JSON files with MD5 hashed keys
- **Default TTL**: 7 days for weapons, 1 day for meta

### Cache Usage

```typescript
import { cache } from './lib/utils/cache';

// Automatic caching
const data = await cache.cached(
  'cache-key',
  async () => {
    // Expensive operation
    return await fetchData();
  },
  7 * 24 * 60 * 60 * 1000 // 7 days
);
```

### Cache Management
- Auto-expiration based on TTL
- Manual clearing for patches
- Statistics tracking

---

## ⚡ Rate Limiting

Prevents overwhelming data sources:

```typescript
const rateLimiters = {
  github: 60 req/min, 5000 req/hour
  truegamedata: 10 req/min
  wzranked: 30 req/min
  symgg: 20 req/min
  codmunity: 30 req/min
}
```

**Features**:
- Automatic queuing
- Wait time calculation
- Per-source limits

---

## 🔒 Legal & Ethics

### Web Scraping Guidelines
1. ✅ Respect robots.txt
2. ✅ Use rate limiting
3. ✅ Identify user agent
4. ✅ Cache aggressively
5. ✅ Check site ToS

### Attribution
Credit data sources in the app:
- "Data from CODArmory community project"
- "Meta rankings from WZRanked"
- "Stats courtesy of TrueGameData"

---

## 📈 Monitoring & Metrics

### Success Metrics
- **Coverage**: 100+ weapons across games
- **Accuracy**: 95%+ match with trusted sources
- **Freshness**: Meta data < 24 hours old
- **Uptime**: 99%+ scraper success rate
- **Cost**: < $5/month Firebase usage

### Error Tracking
- Failed fetches logged to console
- Fallback to cached data on errors
- Discord/email alerts for critical failures

---

## 🔧 Maintenance

### Weekly Tasks
- [ ] Review scraper success rates
- [ ] Check cache hit rates
- [ ] Verify data accuracy
- [ ] Update mock data if needed

### Monthly Tasks
- [ ] Review and update scrapers for site changes
- [ ] Optimize cache TTL values
- [ ] Clean up old meta snapshots
- [ ] Update data schema if needed

### Patch Day Tasks
- [ ] Clear all caches
- [ ] Run full data sync
- [ ] Verify new weapons added
- [ ] Update meta tier lists

---

## 🚧 TODO: Future Enhancements

### Priority 1: Meta Scrapers
- [ ] Implement WZRanked scraper
- [ ] Implement TrueGameData scraper (with permission)
- [ ] Implement CODMunity scraper

### Priority 2: Data Enrichment
- [ ] Add weapon images
- [ ] Add pro player loadouts
- [ ] Add patch notes tracking
- [ ] Add historical meta trends

### Priority 3: Automation
- [ ] Set up GitHub Actions workflows
- [ ] Add Discord webhook notifications
- [ ] Implement automatic patch detection
- [ ] Add data quality monitoring

### Priority 4: Advanced Features
- [ ] Machine learning for meta predictions
- [ ] Community voting on tier lists
- [ ] User-submitted loadouts integration
- [ ] Real-time stats from Activision API

---

## 📞 Support & Resources

### Documentation
- [Firebase Setup](./FIREBASE_SETUP.md)
- [API Documentation](./docs/API.md)
- [Architecture](./ARCHITECTURE_FIXES.md)

### External Resources
- CODArmory: https://github.com/tzurbaev/codarmory.com
- WZRanked: https://wzranked.com
- TrueGameData: https://truegamedata.com
- CODMunity: https://codmunity.gg

### Getting Help
1. Check existing documentation
2. Review error logs
3. Test individual components
4. Create GitHub issue

---

## ✨ Best Practices

1. **Always use caching** - Reduces API calls and improves performance
2. **Rate limit aggressively** - Respect data sources
3. **Validate data** - Ensure quality before storing
4. **Version data** - Track changes over time
5. **Monitor errors** - Quick detection and resolution
6. **Document changes** - Keep this file updated

---

**Last Updated**: 2025-10-07
**Version**: 1.0.0
**Maintainer**: Counterplay Team
