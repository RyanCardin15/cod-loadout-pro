# COD Loadout Pro - ChatGPT App

> **Instant Call of Duty weapon loadouts, counters, and personalized recommendations directly in ChatGPT**

A comprehensive MCP server for ChatGPT Apps that provides expert COD loadout recommendations with beautiful UI components and real-time meta tracking.

## 🎯 Features

### Core Tools
- **🔍 Search Weapons** - Find the best weapons by game, category, situation, and playstyle
- **⚙️ Build Loadouts** - Get complete optimized loadouts with attachments, perks, and equipment
- **🛡️ Counter Strategies** - Analyze enemy weapons and get counter recommendations
- **📊 Meta Tracking** - Real-time tier lists and meta analysis
- **👤 Playstyle Analysis** - Personalized recommendations based on your playstyle
- **⭐ Save Loadouts** - Bookmark and manage your favorite builds
- **📱 My Loadouts** - View and manage all your saved loadouts

### Interactive UI Components
- **LoadoutCard** - Beautiful loadout display with weapon stats
- **MetaTierList** - Visual tier lists with current meta
- **CounterSuggestions** - Counter weapon recommendations
- **MyLoadouts** - Personal loadout gallery

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Firebase project
- Vercel account (for deployment)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd cod-loadout-pro

# Install dependencies
npm install

# Install workspace dependencies
npm run install:all
```

### Environment Setup

1. Copy environment variables:
```bash
cp .env.example .env.local
```

2. Configure Firebase:
   - Create a Firebase project
   - Enable Firestore and Storage
   - Download service account key
   - Update `.env.local` with your Firebase credentials

3. Seed the database:
```bash
npm run seed
```

### Development

```bash
# Start development servers
npm run dev

# Build for production
npm run build

# Deploy to Vercel
npm run deploy
```

## 🏗️ Architecture

### Project Structure
```
cod-loadout-pro/
├── server/              # MCP Server
│   ├── src/
│   │   ├── tools/       # MCP tool implementations
│   │   ├── services/    # Business logic
│   │   ├── models/      # TypeScript interfaces
│   │   ├── firebase/    # Firebase configuration
│   │   └── index.ts     # Main server
│   └── package.json
├── web/                 # React UI Components
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── bridge/      # ChatGPT Apps integration
│   │   └── index.ts     # Component exports
│   └── package.json
├── api/                 # Vercel API endpoints
├── firebase/            # Firebase configuration
├── scripts/             # Database seeding and maintenance
└── vercel.json          # Deployment configuration
```

### Data Models

#### Weapon
```typescript
interface Weapon {
  id: string;
  name: string;
  game: "MW3" | "Warzone" | "BO6" | "MW2";
  category: "AR" | "SMG" | "LMG" | "Sniper" | "Marksman" | "Shotgun" | "Pistol";
  stats: WeaponStats;
  ballistics: WeaponBallistics;
  meta: MetaInfo;
  // ... more fields
}
```

#### Loadout
```typescript
interface Loadout {
  id?: string;
  name: string;
  game: string;
  primary: WeaponLoadout;
  secondary?: WeaponLoadout;
  perks: PerkSelection;
  equipment: EquipmentSelection;
  // ... more fields
}
```

## 🛠️ MCP Tools

### 1. search_weapons
Find the best weapons based on criteria.

**Parameters:**
- `query` - Natural language query
- `game` - COD game filter
- `category` - Weapon category
- `situation` - Combat situation
- `playstyle` - Player style preference
- `tier` - Meta tier filter
- `limit` - Max results

### 2. get_loadout
Build a complete loadout for a weapon.

**Parameters:**
- `weaponId` or `weaponName` - Target weapon
- `game` - Game version
- `situation` - Combat scenario
- `playstyle` - Player preference

### 3. counter_loadout
Get counter strategies for enemy weapons.

**Parameters:**
- `enemyWeapon` - Enemy weapon name
- `enemyLoadout` - Enemy loadout details (optional)
- `game` - Game version
- `myPlaystyle` - Your playstyle

### 4. analyze_playstyle
Analyze and personalize recommendations.

**Parameters:**
- `description` - Playstyle description
- `preferences` - Weapon/range preferences

### 5. get_meta
Get current meta tier lists and trends.

**Parameters:**
- `game` - Game filter
- `category` - Weapon category filter
- `mode` - Game mode filter

### 6. save_loadout
Save a loadout to favorites.

**Parameters:**
- `loadoutId` - Existing loadout ID
- `loadout` - Custom loadout data

### 7. my_loadouts
View all saved loadouts.

**Parameters:** None

## 🎨 UI Components

### LoadoutCard
Interactive loadout display with:
- Weapon stats visualization
- Attachment breakdown
- Perk and equipment listings
- Save functionality

### MetaTierList
Current meta visualization:
- S through D tier rankings
- Usage statistics
- Recent meta changes
- Clickable weapons for loadouts

### CounterSuggestions
Counter strategy display:
- Enemy weapon analysis
- Top counter weapons
- Strategic advice
- Effectiveness ratings

### MyLoadouts
Personal loadout gallery:
- Grid layout of saved builds
- Quick loadout access
- Playstyle categorization
- Creation date tracking

## 🔧 Configuration

### Firebase Setup
1. Create Firestore collections:
   - `weapons`
   - `attachments`
   - `loadouts`
   - `users`
   - `meta_snapshots`
   - `perks`
   - `equipment`

2. Configure security rules (see `firebase/firestore.rules`)

3. Set up storage for weapon images

### Vercel Deployment
1. Connect your GitHub repository
2. Set environment variables:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`
   - `FIREBASE_STORAGE_BUCKET`

3. Deploy with automatic builds

## 📊 Data Management

### Seeding Data
```bash
# Seed initial weapon and attachment data
npm run seed

# Update meta data (run daily)
npm run update-meta
```

### Meta Updates
The meta update script scrapes current weapon usage and win rates from:
- WZRanked.com
- TrueGameData.com
- Community sources

## 🔐 Security

- Firebase security rules restrict write access to admins
- User data is private to each user
- No sensitive data is logged or transmitted
- CORS properly configured for ChatGPT Apps

## 📱 ChatGPT Apps Integration

### MCP Protocol
The server implements the Model Context Protocol for seamless ChatGPT integration:
- JSON-RPC 2.0 communication
- Structured content responses
- Rich metadata for UI components

### Component Registration
UI components are automatically served with proper metadata:
- `openai/outputTemplate` - Component template
- `openai/widgetAccessible` - UI accessibility
- `openai/widgetPrefersBorder` - Styling preferences

## 🚀 Deployment Checklist

### Pre-Launch
- [ ] Firebase project configured
- [ ] Security rules deployed
- [ ] Database seeded with weapon data
- [ ] Environment variables set
- [ ] Components tested in sandbox

### Launch
- [ ] Vercel deployment successful
- [ ] MCP endpoint accessible
- [ ] Firebase connection verified
- [ ] All tools tested in ChatGPT
- [ ] UI components rendering correctly

### Post-Launch
- [ ] Monitor usage and performance
- [ ] Update weapon stats weekly
- [ ] Track meta changes
- [ ] Gather user feedback
- [ ] Add new weapons as released

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🎮 Games Supported

- **Call of Duty: Modern Warfare III (2023)**
- **Call of Duty: Warzone**
- **Call of Duty: Black Ops 6**
- **Call of Duty: Modern Warfare II (2022)**

## 🏆 Meta Tracking

The app tracks weapon meta across:
- **Ranked Play** performance
- **Battle Royale** effectiveness
- **Community usage** statistics
- **Professional player** preferences

---

**Built for Call of Duty players who want instant, expert loadout recommendations without ever leaving ChatGPT.**