# Counterplay Data System

## 🚀 Quick Start

### Initial Data Population
```bash
npm run data:init
```

Fetches weapons and attachments from CODArmory GitHub and populates Firestore.

### Update Meta Data
```bash
npm run data:update
```

Updates tier lists, popularity rankings, and win rates.

---

## 📚 Documentation

- **[DATA_STRATEGY.md](./DATA_STRATEGY.md)** - Complete data strategy and architecture
- **[DATA_IMPLEMENTATION_SUMMARY.md](./DATA_IMPLEMENTATION_SUMMARY.md)** - What we built and how to use it

---

## 🔍 Data Sources

### Primary: CODArmory ✅
- Weapons database
- Attachments with stat modifications
- Auto-updated by community

### Secondary (TODO):
- WZRanked - Meta rankings
- TrueGameData - Ballistics
- CODMunity - Pro loadouts

---

## 📦 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run data:init` | Initial population from CODArmory |
| `npm run data:update` | Update meta data (daily) |
| `npm run data:sync` | Full resync (weekly) |

---

## 🏗️ Architecture

```
CODArmory → Fetch → Transform → Validate → Firestore
                ↓
             Cache (7 days)
```

---

## ✨ Features

- ✅ Rate limiting per data source
- ✅ File-based caching with TTL
- ✅ Data validation and transformation
- ✅ Automatic retry on failures
- ⏳ Web scraping (coming soon)
- ⏳ Automated updates (coming soon)

---

For detailed information, see [DATA_STRATEGY.md](./DATA_STRATEGY.md)
