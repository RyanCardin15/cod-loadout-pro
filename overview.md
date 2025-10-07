# Architectural Plan: COD Loadout Assistant MCP Server for ChatGPT Apps

## 1. **Application Overview**

**App Name:** COD Loadout Pro  
**Purpose:** Instant Call of Duty weapon loadouts, counters, and personalized recommendations  
**Target Users:** 800M+ ChatGPT users who play Call of Duty (any title)  
**Value Proposition:** Never leave ChatGPT to find the perfect loadout - just ask and get expert recommendations

**Core Features:**
- Instant weapon recommendations for any situation
- Full loadout builds (attachments, perks, equipment, field upgrades)
- Counter-strategy suggestions against enemy loadouts
- Playstyle-based personalization (aggressive, tactical, sniper, support)
- Meta tracking (what's winning right now)
- Visual loadout cards with stats
- Save favorites and build custom loadouts
- Multi-game support (MW3, Warzone, BO6, etc.)

## 2. **High-Level Architecture**

```
┌────────────────────────────────────────────────────────┐
│                   ChatGPT Client                        │
│  User: "What's the best gun for ranked Warzone?"       │
└────────────────────┬───────────────────────────────────┘
                     │ JSON-RPC 2.0 / Streamable HTTP
                     ↓
┌────────────────────────────────────────────────────────┐
│              Vercel Edge Functions                      │
│         /mcp - MCP Protocol Endpoint                    │
│  • Session management                                   │
│  • Tool routing                                         │
│  • Component serving                                    │
└────────────────────┬───────────────────────────────────┘
                     │
     ┌───────────────┼───────────────┐
     ↓               ↓               ↓
┌─────────┐   ┌──────────┐   ┌──────────────┐
│ Weapon  │   │ Loadout  │   │ Personalization│
│ Tools   │   │ Builder  │   │    Engine     │
└─────────┘   └──────────┘   └──────────────┘
     │               │               │
     └───────────────┼───────────────┘
                     ↓
┌────────────────────────────────────────────────────────┐
│                Firebase Backend                         │
│  ┌──────────────┐  ┌─────────────┐  ┌──────────────┐ │
│  │  Firestore   │  │   Storage   │  │     Auth     │ │
│  │              │  │             │  │              │ │
│  │ • weapons    │  │ • component │  │ • user       │ │
│  │ • loadouts   │  │   bundles   │  │   sessions   │ │
│  │ • user_data  │  │ • weapon    │  │ • OAuth      │ │
│  │ • meta_data  │  │   images    │  │   tokens     │ │
│  │ • playstyles │  │             │  │              │ │
│  └──────────────┘  └─────────────┘  └──────────────┘ │
└────────────────────────────────────────────────────────┘
```

## 3. **Enhanced Project Structure**

```
cod-loadout-pro/
├── server/                           # MCP Server
│   ├── src/
│   │   ├── index.ts                 # Main MCP server
│   │   ├── config/
│   │   │   ├── games.ts             # CoD game configs (MW3, Warzone, BO6)
│   │   │   └── meta.ts              # Current meta definitions
│   │   │
│   │   ├── tools/
│   │   │   ├── registry.ts          # Tool registration
│   │   │   ├── search-weapons.ts    # Find best weapons
│   │   │   ├── get-loadout.ts       # Full loadout builder
│   │   │   ├── counter-loadout.ts   # Counter strategies
│   │   │   ├── analyze-playstyle.ts # Playstyle detection
│   │   │   ├── get-meta.ts          # Current meta
│   │   │   ├── compare-weapons.ts   # Weapon comparison
│   │   │   ├── save-loadout.ts      # Save to favorites
│   │   │   ├── my-loadouts.ts       # User's saved loadouts
│   │   │   └── recommend.ts         # Personalized recommendations
│   │   │
│   │   ├── services/
│   │   │   ├── weapon-service.ts    # Weapon data logic
│   │   │   ├── loadout-service.ts   # Loadout building logic
│   │   │   ├── meta-service.ts      # Meta tracking
│   │   │   ├── counter-service.ts   # Counter analysis
│   │   │   └── personalization-service.ts # User profiling
│   │   │
│   │   ├── data/
│   │   │   ├── weapons/             # Weapon data by game
│   │   │   │   ├── mw3.ts
│   │   │   │   ├── warzone.ts
│   │   │   │   └── bo6.ts
│   │   │   ├── attachments/         # Attachment data
│   │   │   │   ├── optics.ts
│   │   │   │   ├── barrels.ts
│   │   │   │   ├── magazines.ts
│   │   │   │   └── stocks.ts
│   │   │   ├── perks.ts             # All perks
│   │   │   ├── equipment.ts         # Lethal/tactical
│   │   │   └── field-upgrades.ts    # Field upgrades
│   │   │
│   │   ├── models/
│   │   │   ├── weapon.model.ts      # Weapon type definitions
│   │   │   ├── loadout.model.ts     # Loadout structure
│   │   │   ├── playstyle.model.ts   # Playstyle types
│   │   │   └── user.model.ts        # User profile
│   │   │
│   │   ├── resources/
│   │   │   ├── registry.ts          # Resource registration
│   │   │   └── templates.ts         # Component templates
│   │   │
│   │   ├── firebase/
│   │   │   ├── admin.ts             # Firebase admin setup
│   │   │   ├── firestore.ts         # Firestore helpers
│   │   │   ├── storage.ts           # Storage helpers
│   │   │   └── seeds/               # Initial data seeds
│   │   │       ├── seed-weapons.ts
│   │   │       └── seed-meta.ts
│   │   │
│   │   ├── auth/
│   │   │   ├── oauth.ts             # OAuth 2.1 handler
│   │   │   ├── pkce.ts              # PKCE implementation
│   │   │   └── middleware.ts        # Auth middleware
│   │   │
│   │   └── utils/
│   │       ├── errors.ts            # JSON-RPC errors
│   │       ├── logger.ts            # Structured logging
│   │       ├── validation.ts        # Input validation
│   │       └── stats-calculator.ts  # Weapon stat calculations
│   │
│   ├── package.json
│   └── tsconfig.json
│
├── web/                              # UI Components
│   ├── src/
│   │   ├── components/
│   │   │   ├── LoadoutCard/
│   │   │   │   ├── index.tsx        # Main loadout display
│   │   │   │   ├── WeaponStats.tsx  # Stat bars
│   │   │   │   ├── AttachmentList.tsx
│   │   │   │   └── styles.module.css
│   │   │   │
│   │   │   ├── WeaponComparison/
│   │   │   │   ├── index.tsx        # Side-by-side comparison
│   │   │   │   ├── StatChart.tsx    # Radar/bar charts
│   │   │   │   └── styles.module.css
│   │   │   │
│   │   │   ├── MetaTierList/
│   │   │   │   ├── index.tsx        # Current meta tiers
│   │   │   │   ├── TierRow.tsx
│   │   │   │   └── styles.module.css
│   │   │   │
│   │   │   ├── CounterSuggestions/
│   │   │   │   ├── index.tsx        # Counter loadout grid
│   │   │   │   ├── CounterCard.tsx
│   │   │   │   └── styles.module.css
│   │   │   │
│   │   │   ├── LoadoutBuilder/
│   │   │   │   ├── index.tsx        # Interactive builder
│   │   │   │   ├── AttachmentSelector.tsx
│   │   │   │   ├── PerkSelector.tsx
│   │   │   │   └── styles.module.css
│   │   │   │
│   │   │   ├── MyLoadouts/
│   │   │   │   ├── index.tsx        # User's saved loadouts
│   │   │   │   ├── LoadoutGrid.tsx
│   │   │   │   └── styles.module.css
│   │   │   │
│   │   │   └── PlaystyleProfile/
│   │   │       ├── index.tsx        # User playstyle display
│   │   │       ├── PlaystyleChart.tsx
│   │   │       └── styles.module.css
│   │   │
│   │   ├── bridge/
│   │   │   ├── types.ts             # window.openai types
│   │   │   ├── hooks.ts             # useOpenAI hook
│   │   │   └── actions.ts           # Tool call helpers
│   │   │
│   │   ├── utils/
│   │   │   ├── formatting.ts        # Format stats/numbers
│   │   │   └── icons.ts             # Weapon/perk icons
│   │   │
│   │   └── assets/
│   │       ├── weapon-icons/        # Weapon thumbnails
│   │       └── perk-icons/          # Perk icons
│   │
│   ├── dist/                        # Build output
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── api/
│   └── mcp.ts                       # Vercel endpoint
│
├── firebase/
│   ├── firebase.json
│   ├── firestore.rules
│   ├── firestore.indexes.json
│   └── storage.rules
│
├── scripts/
│   ├── scrape-meta.ts              # Scrape current meta from web
│   ├── update-weapons.ts           # Update weapon stats
│   ├── build-components.ts         # Build UI bundles
│   └── seed-database.ts            # Seed Firebase
│
├── .env.example
├── .env.local
├── package.json
├── vercel.json
└── README.md
```

## 4. **Data Models**

### Weapon Model
```typescript
// server/src/models/weapon.model.ts
export interface Weapon {
  id: string;
  name: string;
  game: "MW3" | "Warzone" | "BO6" | "MW2";
  category: "AR" | "SMG" | "LMG" | "Sniper" | "Marksman" | "Shotgun" | "Pistol";
  
  // Base stats (0-100 scale)
  stats: {
    damage: number;
    range: number;
    accuracy: number;
    fireRate: number;
    mobility: number;
    control: number;
    handling: number;
  };
  
  // Detailed ballistics
  ballistics: {
    damageRanges: Array<{ range: number; damage: number }>;
    ttk: { min: number; max: number };  // Time to kill (ms)
    fireRate: number;  // RPM
    magazineSize: number;
    reloadTime: number;
    adTime: number;  // Aim down sight time
  };
  
  // Available attachments
  attachmentSlots: {
    optic?: string[];
    barrel?: string[];
    magazine?: string[];
    underbarrel?: string[];
    stock?: string[];
    laser?: string[];
    muzzle?: string[];
    rearGrip?: string[];
  };
  
  // Meta information
  meta: {
    tier: "S" | "A" | "B" | "C" | "D";
    popularity: number;  // 0-100
    winRate: number;  // 0-100
    lastUpdated: string;
  };
  
  // Usage recommendations
  bestFor: string[];  // ["Close range", "Ranked", "Aggressive play"]
  playstyles: string[];  // ["Rusher", "Slayer"]
  
  // Visual
  imageUrl: string;
  iconUrl: string;
}

export interface Attachment {
  id: string;
  name: string;
  slot: string;
  weaponCompatibility: string[];  // Weapon IDs
  
  // Stat modifiers
  effects: {
    damage?: number;
    range?: number;
    accuracy?: number;
    fireRate?: number;
    mobility?: number;
    control?: number;
    handling?: number;
  };
  
  pros: string[];
  cons: string[];
  imageUrl?: string;
}

export interface Loadout {
  id?: string;
  userId?: string;
  name: string;
  game: string;
  
  // Primary weapon
  primary: {
    weapon: Weapon;
    attachments: Attachment[];
  };
  
  // Secondary weapon
  secondary?: {
    weapon: Weapon;
    attachments: Attachment[];
  };
  
  // Perks (varies by game)
  perks: {
    perk1?: string;
    perk2?: string;
    perk3?: string;
    perk4?: string;
    bonus?: string;
    ultimate?: string;
  };
  
  // Equipment
  equipment: {
    lethal?: string;
    tactical?: string;
    fieldUpgrade?: string;
  };
  
  // Metadata
  playstyle: string;
  situation: string[];  // ["Close range", "Ranked", "Search & Destroy"]
  effectiveRange: "Close" | "Medium" | "Long" | "Versatile";
  difficulty: "Easy" | "Medium" | "Hard";
  
  // Stats
  overallRating?: number;
  createdAt?: string;
  updatedAt?: string;
  favorites?: number;
  
  // Reasoning
  description?: string;
  tips?: string[];
}

export interface UserProfile {
  userId: string;
  displayName?: string;
  
  // Playstyle preferences
  playstyle: {
    primary: "Aggressive" | "Tactical" | "Sniper" | "Support";
    ranges: {
      close: number;    // 0-100 preference
      medium: number;
      long: number;
    };
    pacing: "Rusher" | "Balanced" | "Camper";
  };
  
  // Favorite games
  games: string[];
  
  // Usage history
  history: {
    queriedWeapons: string[];
    savedLoadouts: string[];
    playtimeByMode: { [mode: string]: number };
  };
  
  // Saved loadouts
  favorites: string[];  // Loadout IDs
  
  // Stats
  totalQueries: number;
  createdAt: string;
  lastActive: string;
}
```

### Firestore Schema
```typescript
// Collections structure
{
  // Weapon database
  weapons: {
    [weaponId]: Weapon
  },
  
  // Attachments database
  attachments: {
    [attachmentId]: Attachment
  },
  
  // Loadouts (both user and community)
  loadouts: {
    [loadoutId]: Loadout
  },
  
  // User profiles
  users: {
    [userId]: UserProfile
  },
  
  // Meta snapshots (historical tracking)
  meta_snapshots: {
    [snapshotId]: {
      game: string,
      date: string,
      topWeapons: Array<{weaponId: string, tier: string, usage: number}>,
      topLoadouts: Array<{loadoutId: string, winRate: number}>,
      changes: Array<{type: string, description: string}>
    }
  },
  
  // Counters database
  counters: {
    [counterId]: {
      targetWeapon: string,
      counterWeapons: Array<{
        weaponId: string,
        effectiveness: number,
        reasoning: string
      }>,
      counterStrategies: string[]
    }
  },
  
  // OAuth sessions
  sessions: {
    [sessionId]: {
      userId: string,
      createdAt: timestamp,
      lastActivity: timestamp,
      widgetState: object
    }
  }
}
```

## 5. **Tool Implementations**

### Tool 1: Search Weapons
```typescript
// server/src/tools/search-weapons.ts
import { z } from "zod";
import { db } from "../firebase/admin";
import { WeaponService } from "../services/weapon-service";

const inputSchema = z.object({
  query: z.string().optional(),
  game: z.enum(["MW3", "Warzone", "BO6", "MW2", "all"]).default("all"),
  category: z.enum(["AR", "SMG", "LMG", "Sniper", "Marksman", "Shotgun", "Pistol", "all"]).default("all"),
  situation: z.string().optional(),  // "ranked", "close range", "sniper support"
  playstyle: z.enum(["Aggressive", "Tactical", "Sniper", "Support", "any"]).default("any"),
  tier: z.array(z.enum(["S", "A", "B", "C", "D"])).optional(),
  limit: z.number().int().min(1).max(10).default(5)
});

export const searchWeaponsTool = {
  name: "search_weapons",
  title: "Search Best Weapons",
  description: "Find the best weapons based on criteria like game, category, situation, and playstyle",
  
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Natural language query like 'best AR for Warzone ranked'"
      },
      game: {
        type: "string",
        enum: ["MW3", "Warzone", "BO6", "MW2", "all"],
        default: "all",
        description: "Which Call of Duty game"
      },
      category: {
        type: "string",
        enum: ["AR", "SMG", "LMG", "Sniper", "Marksman", "Shotgun", "Pistol", "all"],
        default: "all",
        description: "Weapon category"
      },
      situation: {
        type: "string",
        description: "Situation like 'close range', 'ranked', 'search and destroy'"
      },
      playstyle: {
        type: "string",
        enum: ["Aggressive", "Tactical", "Sniper", "Support", "any"],
        default: "any"
      },
      tier: {
        type: "array",
        items: { type: "string", enum: ["S", "A", "B", "C", "D"] },
        description: "Meta tier filter"
      },
      limit: {
        type: "number",
        default: 5,
        minimum: 1,
        maximum: 10
      }
    }
  },
  
  _meta: {
    "openai/outputTemplate": "ui://widget/weapon-list.html",
    "openai/toolInvocation/invoking": "Finding best weapons...",
    "openai/toolInvocation/invoked": "Found the top weapons",
    "openai/widgetAccessible": true,
    "openai/widgetPrefersBorder": true
  },
  
  async execute(input: unknown, context: { userId: string; sessionId: string }) {
    const params = inputSchema.parse(input);
    const weaponService = new WeaponService();
    
    // Search weapons with filters
    const weapons = await weaponService.search({
      game: params.game === "all" ? undefined : params.game,
      category: params.category === "all" ? undefined : params.category,
      situation: params.situation,
      playstyle: params.playstyle === "any" ? undefined : params.playstyle,
      tier: params.tier,
      query: params.query,
      limit: params.limit
    });
    
    // Get user profile for personalization
    const userProfile = await db()
      .collection("users")
      .doc(context.userId)
      .get();
    
    return {
      structuredContent: {
        weapons: weapons.map(w => ({
          id: w.id,
          name: w.name,
          category: w.category,
          game: w.game,
          tier: w.meta.tier,
          stats: {
            damage: w.stats.damage,
            range: w.stats.range,
            mobility: w.stats.mobility,
            control: w.stats.control
          },
          ttk: w.ballistics.ttk,
          popularity: w.meta.popularity,
          imageUrl: w.imageUrl
        })),
        filters: {
          game: params.game,
          category: params.category,
          situation: params.situation
        }
      },
      
      content: [{
        type: "text",
        text: `Found ${weapons.length} top weapons. The best option is the **${weapons[0].name}** (${weapons[0].category}) - currently ${weapons[0].meta.tier} tier with ${weapons[0].meta.popularity}% pick rate.`
      }],
      
      _meta: {
        fullWeapons: weapons,  // Complete weapon objects for component
        userPlaystyle: userProfile.data()?.playstyle,
        timestamp: new Date().toISOString()
      }
    };
  }
};
```

### Tool 2: Get Full Loadout
```typescript
// server/src/tools/get-loadout.ts
import { z } from "zod";
import { LoadoutService } from "../services/loadout-service";

const inputSchema = z.object({
  weaponId: z.string().optional(),
  weaponName: z.string().optional(),
  game: z.enum(["MW3", "Warzone", "BO6", "MW2"]).optional(),
  situation: z.string().optional(),
  playstyle: z.enum(["Aggressive", "Tactical", "Sniper", "Support"]).optional()
}).refine(data => data.weaponId || data.weaponName, {
  message: "Either weaponId or weaponName must be provided"
});

export const getLoadoutTool = {
  name: "get_loadout",
  title: "Build Complete Loadout",
  description: "Get a complete loadout with attachments, perks, and equipment for a weapon",
  
  inputSchema: {
    type: "object",
    properties: {
      weaponId: {
        type: "string",
        description: "Weapon ID to build loadout for"
      },
      weaponName: {
        type: "string",
        description: "Weapon name (if ID not available)"
      },
      game: {
        type: "string",
        enum: ["MW3", "Warzone", "BO6", "MW2"],
        description: "Game version"
      },
      situation: {
        type: "string",
        description: "Situation like 'ranked', 'close range', 'search and destroy'"
      },
      playstyle: {
        type: "string",
        enum: ["Aggressive", "Tactical", "Sniper", "Support"],
        description: "Your playstyle"
      }
    }
  },
  
  _meta: {
    "openai/outputTemplate": "ui://widget/loadout-card.html",
    "openai/toolInvocation/invoking": "Building your loadout...",
    "openai/toolInvocation/invoked": "Loadout ready!",
    "openai/widgetAccessible": true,
    "openai/widgetPrefersBorder": true
  },
  
  async execute(input: unknown, context: { userId: string; sessionId: string }) {
    const params = inputSchema.parse(input);
    const loadoutService = new LoadoutService();
    
    // Build optimal loadout
    const loadout = await loadoutService.buildLoadout({
      weaponId: params.weaponId,
      weaponName: params.weaponName,
      game: params.game,
      situation: params.situation,
      playstyle: params.playstyle,
      userId: context.userId
    });
    
    // Calculate overall stats
    const finalStats = loadoutService.calculateFinalStats(loadout);
    
    return {
      structuredContent: {
        loadout: {
          id: loadout.id,
          name: loadout.name,
          primary: {
            weaponName: loadout.primary.weapon.name,
            weaponId: loadout.primary.weapon.id,
            category: loadout.primary.weapon.category,
            attachments: loadout.primary.attachments.map(a => ({
              id: a.id,
              name: a.name,
              slot: a.slot
            }))
          },
          secondary: loadout.secondary ? {
            weaponName: loadout.secondary.weapon.name,
            attachments: loadout.secondary.attachments.map(a => a.name)
          } : null,
          perks: loadout.perks,
          equipment: loadout.equipment,
          stats: finalStats,
          effectiveRange: loadout.effectiveRange,
          difficulty: loadout.difficulty
        }
      },
      
      content: [{
        type: "text",
        text: `**${loadout.name}**\n\n` +
              `Primary: ${loadout.primary.weapon.name} (${loadout.primary.weapon.category})\n` +
              `Attachments: ${loadout.primary.attachments.map(a => a.name).join(', ')}\n\n` +
              `${loadout.description}\n\n` +
              `Pro Tips:\n${loadout.tips?.map(t => `• ${t}`).join('\n')}`
      }],
      
      _meta: {
        fullLoadout: loadout,
        alternativeAttachments: await loadoutService.getAlternatives(loadout),
        canSave: true,
        loadoutId: loadout.id
      }
    };
  }
};
```

### Tool 3: Counter Loadout
```typescript
// server/src/tools/counter-loadout.ts
import { z } from "zod";
import { CounterService } from "../services/counter-service";

const inputSchema = z.object({
  enemyWeapon: z.string(),
  enemyLoadout: z.object({
    attachments: z.array(z.string()).optional(),
    perks: z.array(z.string()).optional()
  }).optional(),
  game: z.enum(["MW3", "Warzone", "BO6", "MW2"]).optional(),
  myPlaystyle: z.enum(["Aggressive", "Tactical", "Sniper", "Support"]).optional()
});

export const counterLoadoutTool = {
  name: "counter_loadout",
  title: "Counter Enemy Loadout",
  description: "Get the best counters and strategies against an enemy weapon or loadout",
  
  inputSchema: {
    type: "object",
    properties: {
      enemyWeapon: {
        type: "string",
        description: "Enemy weapon name or ID"
      },
      enemyLoadout: {
        type: "object",
        properties: {
          attachments: {
            type: "array",
            items: { type: "string" }
          },
          perks: {
            type: "array",
            items: { type: "string" }
          }
        }
      },
      game: {
        type: "string",
        enum: ["MW3", "Warzone", "BO6", "MW2"]
      },
      myPlaystyle: {
        type: "string",
        enum: ["Aggressive", "Tactical", "Sniper", "Support"]
      }
    },
    required: ["enemyWeapon"]
  },
  
  _meta: {
    "openai/outputTemplate": "ui://widget/counter-suggestions.html",
    "openai/toolInvocation/invoking": "Analyzing enemy loadout...",
    "openai/toolInvocation/invoked": "Counter strategies ready",
    "openai/widgetAccessible": true,
    "openai/widgetPrefersBorder": true
  },
  
  async execute(input: unknown, context: { userId: string; sessionId: string }) {
    const params = inputSchema.parse(input);
    const counterService = new CounterService();
    
    // Analyze enemy weapon
    const enemyWeapon = await counterService.getWeaponByName(params.enemyWeapon);
    
    // Find best counters
    const counters = await counterService.findCounters({
      enemyWeapon,
      enemyLoadout: params.enemyLoadout,
      userPlaystyle: params.myPlaystyle,
      game: params.game
    });
    
    return {
      structuredContent: {
        enemyWeapon: {
          name: enemyWeapon.name,
          category: enemyWeapon.category,
          strengths: counterService.identifyStrengths(enemyWeapon),
          weaknesses: counterService.identifyWeaknesses(enemyWeapon)
        },
        counterWeapons: counters.weapons.map(c => ({
          weaponId: c.weapon.id,
          weaponName: c.weapon.name,
          category: c.weapon.category,
          effectiveness: c.effectiveness,
          reasoning: c.reasoning
        })),
        strategies: counters.strategies,
        tacticalAdvice: counters.tacticalAdvice
      },
      
      content: [{
        type: "text",
        text: `**Countering ${enemyWeapon.name}**\n\n` +
              `Top Counter: ${counters.weapons[0].weapon.name} (${counters.weapons[0].effectiveness}% effective)\n\n` +
              `${counters.weapons[0].reasoning}\n\n` +
              `Key Strategies:\n${counters.strategies.map(s => `• ${s}`).join('\n')}`
      }],
      
      _meta: {
        allCounters: counters,
        enemyFullData: enemyWeapon,
        perksToCounter: counterService.suggestCounterPerks(enemyWeapon)
      }
    };
  }
};
```

### Tool 4: Analyze Playstyle
```typescript
// server/src/tools/analyze-playstyle.ts
import { z } from "zod";
import { PersonalizationService } from "../services/personalization-service";

const inputSchema = z.object({
  description: z.string().optional(),
  preferences: z.object({
    favoriteWeapons: z.array(z.string()).optional(),
    favoriteRange: z.enum(["Close", "Medium", "Long"]).optional(),
    gameModes: z.array(z.string()).optional(),
    aggressiveness: z.number().min(1).max(10).optional()
  }).optional()
});

export const analyzePlaystyleTool = {
  name: "analyze_playstyle",
  title: "Analyze Playstyle",
  description: "Analyze your playstyle to get personalized weapon and loadout recommendations",
  
  inputSchema: {
    type: "object",
    properties: {
      description: {
        type: "string",
        description: "Describe how you play (e.g., 'I like rushing with SMGs')"
      },
      preferences: {
        type: "object",
        properties: {
          favoriteWeapons: {
            type: "array",
            items: { type: "string" },
            description: "Your favorite weapons"
          },
          favoriteRange: {
            type: "string",
            enum: ["Close", "Medium", "Long"]
          },
          gameModes: {
            type: "array",
            items: { type: "string" },
            description: "Favorite game modes"
          },
          aggressiveness: {
            type: "number",
            minimum: 1,
            maximum: 10,
            description: "How aggressive (1=camper, 10=rusher)"
          }
        }
      }
    }
  },
  
  _meta: {
    "openai/outputTemplate": "ui://widget/playstyle-profile.html",
    "openai/toolInvocation/invoking": "Analyzing your playstyle...",
    "openai/toolInvocation/invoked": "Profile created",
    "openai/widgetAccessible": false
  },
  
  async execute(input: unknown, context: { userId: string; sessionId: string }) {
    const params = inputSchema.parse(input);
    const personalizationService = new PersonalizationService();
    
    // Analyze playstyle from description and preferences
    const playstyleProfile = await personalizationService.analyzePlaystyle({
      userId: context.userId,
      description: params.description,
      preferences: params.preferences
    });
    
    // Get recommendations based on playstyle
    const recommendations = await personalizationService.getRecommendations(
      playstyleProfile
    );
    
    // Save to user profile
    await db()
      .collection("users")
      .doc(context.userId)
      .set({ playstyle: playstyleProfile }, { merge: true });
    
    return {
      structuredContent: {
        playstyle: {
          primary: playstyleProfile.primary,
          ranges: playstyleProfile.ranges,
          pacing: playstyleProfile.pacing,
          strengths: playstyleProfile.strengths,
          recommendedWeapons: recommendations.weapons.slice(0, 5).map(w => w.name),
          recommendedPerks: recommendations.perks
        }
      },
      
      content: [{
        type: "text",
        text: `**Your Playstyle: ${playstyleProfile.primary}**\n\n` +
              `You're a ${playstyleProfile.pacing} who excels at ${playstyleProfile.ranges.close > 70 ? 'close' : playstyleProfile.ranges.long > 70 ? 'long' : 'medium'} range combat.\n\n` +
              `Top weapons for you:\n${recommendations.weapons.slice(0, 3).map((w, i) => `${i + 1}. ${w.name}`).join('\n')}`
      }],
      
      _meta: {
        fullProfile: playstyleProfile,
        allRecommendations: recommendations
      }
    };
  }
};
```

### Tool 5: Get Current Meta
```typescript
// server/src/tools/get-meta.ts
import { z } from "zod";
import { MetaService } from "../services/meta-service";

const inputSchema = z.object({
  game: z.enum(["MW3", "Warzone", "BO6", "MW2", "all"]).default("all"),
  category: z.enum(["AR", "SMG", "LMG", "Sniper", "Marksman", "Shotgun", "Pistol", "all"]).default("all"),
  mode: z.string().optional()  // "Ranked", "Battle Royale", etc.
});

export const getMetaTool = {
  name: "get_meta",
  title: "Current Meta",
  description: "Get the current meta weapons, loadouts, and tier lists",
  
  inputSchema: {
    type: "object",
    properties: {
      game: {
        type: "string",
        enum: ["MW3", "Warzone", "BO6", "MW2", "all"],
        default: "all"
      },
      category: {
        type: "string",
        enum: ["AR", "SMG", "LMG", "Sniper", "Marksman", "Shotgun", "Pistol", "all"],
        default: "all"
      },
      mode: {
        type: "string",
        description: "Game mode like 'Ranked' or 'Battle Royale'"
      }
    }
  },
  
  _meta: {
    "openai/outputTemplate": "ui://widget/meta-tier-list.html",
    "openai/toolInvocation/invoking": "Loading current meta...",
    "openai/toolInvocation/invoked": "Meta loaded",
    "openai/widgetAccessible": true,
    "openai/widgetPrefersBorder": true
  },
  
  async execute(input: unknown, context: { userId: string; sessionId: string }) {
    const params = inputSchema.parse(input);
    const metaService = new MetaService();
    
    // Get current meta snapshot
    const meta = await metaService.getCurrentMeta({
      game: params.game === "all" ? undefined : params.game,
      category: params.category === "all" ? undefined : params.category,
      mode: params.mode
    });
    
    return {
      structuredContent: {
        tiers: {
          S: meta.tiers.S.map(w => ({ id: w.id, name: w.name, usage: w.usage })),
          A: meta.tiers.A.map(w => ({ id: w.id, name: w.name, usage: w.usage })),
          B: meta.tiers.B.map(w => ({ id: w.id, name: w.name, usage: w.usage })),
          C: meta.tiers.C.map(w => ({ id: w.id, name: w.name, usage: w.usage })),
          D: meta.tiers.D.map(w => ({ id: w.id, name: w.name, usage: w.usage }))
        },
        topLoadouts: meta.topLoadouts.slice(0, 3),
        recentChanges: meta.recentChanges,
        lastUpdated: meta.lastUpdated
      },
      
      content: [{
        type: "text",
        text: `**Current Meta (${params.game !== 'all' ? params.game : 'All Games'})**\n\n` +
              `S-Tier: ${meta.tiers.S.map(w => w.name).join(', ')}\n\n` +
              `Recent Changes:\n${meta.recentChanges.slice(0, 3).map(c => `• ${c}`).join('\n')}`
      }],
      
      _meta: {
        fullMeta: meta,
        historicalData: await metaService.getHistoricalMeta(7)  // Last 7 days
      }
    };
  }
};
```

### Tool 6: Save Loadout
```typescript
// server/src/tools/save-loadout.ts
import { z } from "zod";
import { db } from "../firebase/admin";

const inputSchema = z.object({
  loadoutId: z.string().optional(),
  loadout: z.object({
    name: z.string(),
    primaryWeapon: z.string(),
    attachments: z.array(z.string()),
    perks: z.object({}).passthrough(),
    equipment: z.object({}).passthrough()
  }).optional()
}).refine(data => data.loadoutId || data.loadout, {
  message: "Either loadoutId or loadout must be provided"
});

export const saveLoadoutTool = {
  name: "save_loadout",
  title: "Save Loadout",
  description: "Save a loadout to your favorites",
  
  inputSchema: {
    type: "object",
    properties: {
      loadoutId: {
        type: "string",
        description: "ID of existing loadout to save"
      },
      loadout: {
        type: "object",
        description: "Custom loadout to save",
        properties: {
          name: { type: "string" },
          primaryWeapon: { type: "string" },
          attachments: { type: "array", items: { type: "string" } },
          perks: { type: "object" },
          equipment: { type: "object" }
        }
      }
    }
  },
  
  _meta: {
    "openai/toolInvocation/invoking": "Saving loadout...",
    "openai/toolInvocation/invoked": "Loadout saved!"
  },
  
  async execute(input: unknown, context: { userId: string; sessionId: string }) {
    const params = inputSchema.parse(input);
    
    let loadoutId: string;
    
    if (params.loadoutId) {
      // Save existing loadout to favorites
      loadoutId = params.loadoutId;
      await db()
        .collection("users")
        .doc(context.userId)
        .update({
          favorites: admin.firestore.FieldValue.arrayUnion(loadoutId)
        });
    } else {
      // Create new custom loadout
      const loadoutRef = await db()
        .collection("loadouts")
        .add({
          ...params.loadout,
          userId: context.userId,
          createdAt: new Date().toISOString(),
          favorites: 0
        });
      
      loadoutId = loadoutRef.id;
      
      await db()
        .collection("users")
        .doc(context.userId)
        .update({
          favorites: admin.firestore.FieldValue.arrayUnion(loadoutId)
        });
    }
    
    return {
      structuredContent: {
        success: true,
        loadoutId,
        message: "Loadout saved to your favorites"
      },
      
      content: [{
        type: "text",
        text: `✓ Loadout saved! You can access it anytime with "show my loadouts"`
      }]
    };
  }
};
```

### Tool 7: My Loadouts
```typescript
// server/src/tools/my-loadouts.ts
import { db } from "../firebase/admin";

export const myLoadoutsTool = {
  name: "my_loadouts",
  title: "My Saved Loadouts",
  description: "View all your saved loadouts",
  
  inputSchema: {
    type: "object",
    properties: {}
  },
  
  _meta: {
    "openai/outputTemplate": "ui://widget/my-loadouts.html",
    "openai/toolInvocation/invoking": "Loading your loadouts...",
    "openai/toolInvocation/invoked": "Loadouts loaded",
    "openai/widgetAccessible": true,
    "openai/widgetPrefersBorder": true
  },
  
  async execute(input: unknown, context: { userId: string; sessionId: string }) {
    // Get user's favorite loadouts
    const userDoc = await db()
      .collection("users")
      .doc(context.userId)
      .get();
    
    const favoriteIds = userDoc.data()?.favorites || [];
    
    if (favoriteIds.length === 0) {
      return {
        structuredContent: {
          loadouts: [],
          count: 0
        },
        content: [{
          type: "text",
          text: "You haven't saved any loadouts yet. Try asking for a weapon loadout and save it!"
        }]
      };
    }
    
    // Fetch all favorite loadouts
    const loadouts = await Promise.all(
      favoriteIds.map(async (id: string) => {
        const doc = await db().collection("loadouts").doc(id).get();
        return { id: doc.id, ...doc.data() };
      })
    );
    
    return {
      structuredContent: {
        loadouts: loadouts.map(l => ({
          id: l.id,
          name: l.name,
          primaryWeapon: l.primary?.weapon?.name,
          game: l.game,
          playstyle: l.playstyle,
          createdAt: l.createdAt
        })),
        count: loadouts.length
      },
      
      content: [{
        type: "text",
        text: `You have ${loadouts.length} saved loadout${loadouts.length !== 1 ? 's' : ''}. Click any loadout to view details or ask me to build a new loadout based on one of these.`
      }],
      
      _meta: {
        fullLoadouts: loadouts
      }
    };
  }
};
```

## 6. **Component Implementations**

### LoadoutCard Component
```typescript
// web/src/components/LoadoutCard/index.tsx
import React, { useEffect, useState } from "react";
import { useOpenAI } from "../../bridge/hooks";
import { WeaponStats } from "./WeaponStats";
import { AttachmentList } from "./AttachmentList";
import "./styles.module.css";

export const LoadoutCard: React.FC = () => {
  const { toolOutput, callTool, setWidgetState, theme } = useOpenAI();
  const [loadout, setLoadout] = useState<any>(null);

  useEffect(() => {
    if (toolOutput?.structuredContent?.loadout) {
      setLoadout(toolOutput.structuredContent.loadout);
    }
  }, [toolOutput]);

  const handleSaveLoadout = async () => {
    const loadoutId = toolOutput._meta?.loadoutId;
    await callTool("save_loadout", { loadoutId });
  };

  const handleViewAlternatives = async () => {
    await setWidgetState({ view: "alternatives" });
    // Component re-renders with alternatives from _meta
  };

  if (!loadout) return <div>Loading...</div>;

  return (
    <div className={`loadout-card theme-${theme}`}>
      <div className="loadout-header">
        <h2>{loadout.name}</h2>
        <button onClick={handleSaveLoadout} className="save-btn">
          ⭐ Save Loadout
        </button>
      </div>

      {/* Primary Weapon */}
      <div className="weapon-section">
        <div className="weapon-info">
          <img 
            src={toolOutput._meta?.fullLoadout?.primary?.weapon?.imageUrl} 
            alt={loadout.primary.weaponName}
            className="weapon-image"
          />
          <div className="weapon-details">
            <h3>{loadout.primary.weaponName}</h3>
            <span className="weapon-category">{loadout.primary.category}</span>
          </div>
        </div>

        <WeaponStats stats={loadout.stats} />
        <AttachmentList attachments={loadout.primary.attachments} />
      </div>

      {/* Secondary Weapon */}
      {loadout.secondary && (
        <div className="weapon-section secondary">
          <h4>Secondary: {loadout.secondary.weaponName}</h4>
          <AttachmentList attachments={loadout.secondary.attachments} />
        </div>
      )}

      {/* Perks */}
      <div className="perks-section">
        <h4>Perks</h4>
        <div className="perks-grid">
          {Object.entries(loadout.perks).map(([slot, perk]) => (
            perk && (
              <div key={slot} className="perk-item">
                <span className="perk-slot">{slot}</span>
                <span className="perk-name">{perk as string}</span>
              </div>
            )
          ))}
        </div>
      </div>

      {/* Equipment */}
      <div className="equipment-section">
        <h4>Equipment</h4>
        <div className="equipment-grid">
          {loadout.equipment.lethal && (
            <div className="equipment-item">
              <span className="label">Lethal:</span> {loadout.equipment.lethal}
            </div>
          )}
          {loadout.equipment.tactical && (
            <div className="equipment-item">
              <span className="label">Tactical:</span> {loadout.equipment.tactical}
            </div>
          )}
          {loadout.equipment.fieldUpgrade && (
            <div className="equipment-item">
              <span className="label">Field Upgrade:</span> {loadout.equipment.fieldUpgrade}
            </div>
          )}
        </div>
      </div>

      {/* Metadata */}
      <div className="loadout-meta">
        <div className="meta-item">
          <span className="label">Effective Range:</span>
          <span className="value">{loadout.effectiveRange}</span>
        </div>
        <div className="meta-item">
          <span className="label">Difficulty:</span>
          <span className="value">{loadout.difficulty}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="loadout-actions">
        <button onClick={handleViewAlternatives} className="alt-btn">
          View Alternative Attachments
        </button>
      </div>
    </div>
  );
};
```

### WeaponStats Subcomponent
```typescript
// web/src/components/LoadoutCard/WeaponStats.tsx
import React from "react";

interface WeaponStatsProps {
  stats: {
    damage: number;
    range: number;
    accuracy: number;
    fireRate: number;
    mobility: number;
    control: number;
  };
}

export const WeaponStats: React.FC<WeaponStatsProps> = ({ stats }) => {
  const statOrder = [
    { key: "damage", label: "Damage", color: "#ef4444" },
    { key: "range", label: "Range", color: "#3b82f6" },
    { key: "accuracy", label: "Accuracy", color: "#10b981" },
    { key: "fireRate", label: "Fire Rate", color: "#f59e0b" },
    { key: "mobility", label: "Mobility", color: "#8b5cf6" },
    { key: "control", label: "Control", color: "#ec4899" }
  ];

  return (
    <div className="weapon-stats">
      {statOrder.map(({ key, label, color }) => (
        <div key={key} className="stat-row">
          <span className="stat-label">{label}</span>
          <div className="stat-bar-container">
            <div 
              className="stat-bar" 
              style={{ 
                width: `${stats[key as keyof typeof stats]}%`,
                backgroundColor: color
              }}
            />
          </div>
          <span className="stat-value">{stats[key as keyof typeof stats]}</span>
        </div>
      ))}
    </div>
  );
};
```

### Meta Tier List Component
```typescript
// web/src/components/MetaTierList/index.tsx
import React, { useEffect, useState } from "react";
import { useOpenAI } from "../../bridge/hooks";
import "./styles.module.css";

export const MetaTierList: React.FC = () => {
  const { toolOutput, callTool, theme } = useOpenAI();
  const [tiers, setTiers] = useState<any>(null);

  useEffect(() => {
    if (toolOutput?.structuredContent?.tiers) {
      setTiers(toolOutput.structuredContent.tiers);
    }
  }, [toolOutput]);

  const handleWeaponClick = async (weaponId: string) => {
    await callTool("get_loadout", { weaponId });
  };

  const tierColors = {
    S: "#ff0000",
    A: "#ff8800",
    B: "#ffdd00",
    C: "#88ff00",
    D: "#00ff00"
  };

  if (!tiers) return <div>Loading meta...</div>;

  return (
    <div className={`meta-tier-list theme-${theme}`}>
      <div className="tier-header">
        <h2>Current Meta Tier List</h2>
        <span className="last-updated">
          Updated: {new Date(toolOutput.structuredContent.lastUpdated).toLocaleDateString()}
        </span>
      </div>

      {Object.entries(tiers).map(([tier, weapons]: [string, any]) => (
        <div key={tier} className="tier-section">
          <div 
            className="tier-label" 
            style={{ backgroundColor: tierColors[tier as keyof typeof tierColors] }}
          >
            {tier}
          </div>
          <div className="tier-weapons">
            {weapons.map((weapon: any) => (
              <div 
                key={weapon.id}
                className="weapon-card"
                onClick={() => handleWeaponClick(weapon.id)}
              >
                <div className="weapon-name">{weapon.name}</div>
                <div className="weapon-usage">{weapon.usage}% pick rate</div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {toolOutput.structuredContent.recentChanges?.length > 0 && (
        <div className="recent-changes">
          <h3>Recent Changes</h3>
          <ul>
            {toolOutput.structuredContent.recentChanges.map((change: string, i: number) => (
              <li key={i}>{change}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
```

## 7. **Service Layer Implementations**

### Weapon Service
```typescript
// server/src/services/weapon-service.ts
import { db } from "../firebase/admin";
import { Weapon } from "../models/weapon.model";

export class WeaponService {
  async search(params: {
    game?: string;
    category?: string;
    situation?: string;
    playstyle?: string;
    tier?: string[];
    query?: string;
    limit: number;
  }): Promise<Weapon[]> {
    let query = db().collection("weapons");

    // Apply filters
    if (params.game) {
      query = query.where("game", "==", params.game);
    }
    if (params.category) {
      query = query.where("category", "==", params.category);
    }
    if (params.tier && params.tier.length > 0) {
      query = query.where("meta.tier", "in", params.tier);
    }

    // Sort by meta rating (tier + popularity)
    query = query.orderBy("meta.popularity", "desc");
    query = query.limit(params.limit * 2);  // Get more for filtering

    const snapshot = await query.get();
    let weapons = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Weapon));

    // Filter by situation (array includes)
    if (params.situation) {
      weapons = weapons.filter(w => 
        w.bestFor.some(b => b.toLowerCase().includes(params.situation!.toLowerCase()))
      );
    }

    // Filter by playstyle
    if (params.playstyle) {
      weapons = weapons.filter(w => w.playstyles.includes(params.playstyle!));
    }

    // Natural language query matching
    if (params.query) {
      const queryLower = params.query.toLowerCase();
      weapons = weapons.filter(w =>
        w.name.toLowerCase().includes(queryLower) ||
        w.bestFor.some(b => b.toLowerCase().includes(queryLower)) ||
        w.category.toLowerCase().includes(queryLower)
      );
    }

    return weapons.slice(0, params.limit);
  }

  async getById(weaponId: string): Promise<Weapon | null> {
    const doc = await db().collection("weapons").doc(weaponId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as Weapon;
  }

  async getByName(weaponName: string, game?: string): Promise<Weapon | null> {
    let query = db().collection("weapons").where("name", "==", weaponName);
    
    if (game) {
      query = query.where("game", "==", game);
    }

    const snapshot = await query.limit(1).get();
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Weapon;
  }
}
```

### Loadout Service
```typescript
// server/src/services/loadout-service.ts
import { db } from "../firebase/admin";
import { Weapon, Attachment, Loadout } from "../models/weapon.model";
import { WeaponService } from "./weapon-service";

export class LoadoutService {
  private weaponService = new WeaponService();

  async buildLoadout(params: {
    weaponId?: string;
    weaponName?: string;
    game?: string;
    situation?: string;
    playstyle?: string;
    userId: string;
  }): Promise<Loadout> {
    // Get the weapon
    let weapon: Weapon | null;
    if (params.weaponId) {
      weapon = await this.weaponService.getById(params.weaponId);
    } else {
      weapon = await this.weaponService.getByName(params.weaponName!, params.game);
    }

    if (!weapon) {
      throw new Error("Weapon not found");
    }

    // Get optimal attachments based on situation and playstyle
    const attachments = await this.selectOptimalAttachments(
      weapon,
      params.situation,
      params.playstyle
    );

    // Get optimal perks
    const perks = await this.selectOptimalPerks(
      weapon,
      params.game || weapon.game,
      params.playstyle
    );

    // Get optimal equipment
    const equipment = await this.selectOptimalEquipment(
      weapon,
      params.playstyle
    );

    // Build the loadout
    const loadout: Loadout = {
      name: `${weapon.name} ${params.playstyle || 'Optimal'} Build`,
      game: params.game || weapon.game,
      primary: {
        weapon,
        attachments
      },
      perks,
      equipment,
      playstyle: params.playstyle || "Balanced",
      situation: params.situation ? [params.situation] : weapon.bestFor,
      effectiveRange: this.determineEffectiveRange(weapon, attachments),
      difficulty: this.calculateDifficulty(weapon),
      description: this.generateDescription(weapon, attachments, params),
      tips: this.generateTips(weapon, params.playstyle),
      createdAt: new Date().toISOString()
    };

    return loadout;
  }

  private async selectOptimalAttachments(
    weapon: Weapon,
    situation?: string,
    playstyle?: string
  ): Promise<Attachment[]> {
    const attachments: Attachment[] = [];
    
    // Define attachment priorities based on playstyle
    const priorities = this.getAttachmentPriorities(playstyle);

    // Select best attachment for each slot
    for (const [slot, availableIds] of Object.entries(weapon.attachmentSlots)) {
      if (!availableIds || availableIds.length === 0) continue;

      // Fetch all attachments for this slot
      const slotAttachments = await Promise.all(
        availableIds.map(async (id: string) => {
          const doc = await db().collection("attachments").doc(id).get();
          return { id: doc.id, ...doc.data() } as Attachment;
        })
      );

      // Score each attachment based on priorities
      const scored = slotAttachments.map(att => ({
        attachment: att,
        score: this.scoreAttachment(att, priorities)
      }));

      // Pick the best one
      scored.sort((a, b) => b.score - a.score);
      if (scored[0]) {
        attachments.push(scored[0].attachment);
      }
    }

    // Limit to 5 attachments (CoD standard)
    return attachments.slice(0, 5);
  }

  private getAttachmentPriorities(playstyle?: string): any {
    const priorities: any = {
      Aggressive: { mobility: 3, handling: 3, damage: 2, control: 1 },
      Tactical: { accuracy: 3, control: 3, range: 2, damage: 1 },
      Sniper: { accuracy: 3, range: 3, damage: 2, handling: 1 },
      Support: { control: 3, accuracy: 2, damage: 2, range: 2 }
    };

    return priorities[playstyle || "Tactical"] || priorities.Tactical;
  }

  private scoreAttachment(attachment: Attachment, priorities: any): number {
    let score = 0;
    
    for (const [stat, weight] of Object.entries(priorities)) {
      const effect = attachment.effects[stat as keyof typeof attachment.effects] || 0;
      score += effect * (weight as number);
    }

    return score;
  }

  private async selectOptimalPerks(
    weapon: Weapon,
    game: string,
    playstyle?: string
  ): Promise<any> {
    // Load perks for the game
    const perksSnapshot = await db()
      .collection("perks")
      .where("game", "==", game)
      .get();

    const allPerks = perksSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Select perks based on playstyle
    const perkSelection: any = {};

    if (playstyle === "Aggressive") {
      perkSelection.perk1 = "Double Time";
      perkSelection.perk2 = "Quick Fix";
      perkSelection.perk3 = "Tempered";
      perkSelection.perk4 = "Ghost";
    } else if (playstyle === "Tactical") {
      perkSelection.perk1 = "Overkill";
      perkSelection.perk2 = "Sleight of Hand";
      perkSelection.perk3 = "Tempered";
      perkSelection.perk4 = "High Alert";
    } else if (playstyle === "Sniper") {
      perkSelection.perk1 = "Overkill";
      perkSelection.perk2 = "Tracker";
      perkSelection.perk3 = "Focus";
      perkSelection.perk4 = "Ghost";
    } else {
      // Default/Support
      perkSelection.perk1 = "Scavenger";
      perkSelection.perk2 = "Fast Hands";
      perkSelection.perk3 = "Tempered";
      perkSelection.perk4 = "Birdseye";
    }

    return perkSelection;
  }

  private async selectOptimalEquipment(
    weapon: Weapon,
    playstyle?: string
  ): Promise<any> {
    const equipment: any = {};

    if (playstyle === "Aggressive") {
      equipment.lethal = "Semtex";
      equipment.tactical = "Stun Grenade";
      equipment.fieldUpgrade = "Dead Silence";
    } else if (playstyle === "Sniper") {
      equipment.lethal = "Claymore";
      equipment.tactical = "Snapshot Grenade";
      equipment.fieldUpgrade = "Munitions Box";
    } else {
      equipment.lethal = "Frag Grenade";
      equipment.tactical = "Flash Grenade";
      equipment.fieldUpgrade = "Trophy System";
    }

    return equipment;
  }

  calculateFinalStats(loadout: Loadout): any {
    const baseStats = { ...loadout.primary.weapon.stats };
    
    // Apply attachment modifiers
    for (const attachment of loadout.primary.attachments) {
      for (const [stat, modifier] of Object.entries(attachment.effects)) {
        if (baseStats.hasOwnProperty(stat)) {
          baseStats[stat as keyof typeof baseStats] += modifier;
        }
      }
    }

    // Clamp values to 0-100
    for (const stat of Object.keys(baseStats)) {
      baseStats[stat as keyof typeof baseStats] = Math.max(
        0,
        Math.min(100, baseStats[stat as keyof typeof baseStats])
      );
    }

    return baseStats;
  }

  private determineEffectiveRange(weapon: Weapon, attachments: Attachment[]): string {
    const rangeBonus = attachments.reduce((sum, att) => sum + (att.effects.range || 0), 0);
    const finalRange = weapon.stats.range + rangeBonus;

    if (finalRange >= 70) return "Long";
    if (finalRange >= 40) return "Medium";
    return "Close";
  }

  private calculateDifficulty(weapon: Weapon): string {
    const control = weapon.stats.control;
    const accuracy = weapon.stats.accuracy;
    
    const average = (control + accuracy) / 2;
    
    if (average >= 70) return "Easy";
    if (average >= 50) return "Medium";
    return "Hard";
  }

  private generateDescription(weapon: Weapon, attachments: Attachment[], params: any): string {
    return `This ${weapon.name} build is optimized for ${params.playstyle || 'balanced'} gameplay. ` +
           `With ${attachments.length} carefully selected attachments, this loadout excels at ` +
           `${params.situation || 'versatile combat situations'}. Perfect for players who want ` +
           `reliable performance in ${weapon.game}.`;
  }

  private generateTips(weapon: Weapon, playstyle?: string): string[] {
    const tips: string[] = [];

    if (weapon.category === "AR") {
      tips.push("Pre-aim common angles to maximize your TTK advantage");
      tips.push("Tap fire at long ranges for better accuracy");
    } else if (weapon.category === "SMG") {
      tips.push("Keep moving - your mobility is your greatest asset");
      tips.push("Get in close where you have the advantage");
    } else if (weapon.category === "Sniper") {
      tips.push("Hold power positions and lanes");
      tips.push("Have a secondary ready for close encounters");
    }

    if (playstyle === "Aggressive") {
      tips.push("Use slide cancels and jump shots to outplay opponents");
    } else if (playstyle === "Tactical") {
      tips.push("Use cover and angles to your advantage");
    }

    return tips;
  }

  async getAlternatives(loadout: Loadout): Promise<any> {
    // Return alternative attachments for each slot
    const alternatives: any = {};
    
    for (const attachment of loadout.primary.attachments) {
      const slot = attachment.slot;
      const availableForSlot = loadout.primary.weapon.attachmentSlots[slot as keyof typeof loadout.primary.weapon.attachmentSlots];
      
      if (availableForSlot) {
        const alts = await Promise.all(
          availableForSlot.slice(0, 3).map(async (id: string) => {
            const doc = await db().collection("attachments").doc(id).get();
            return { id: doc.id, ...doc.data() };
          })
        );
        alternatives[slot] = alts;
      }
    }

    return alternatives;
  }
}
```

## 8. **Firebase Initialization & Seeding**

### Seed Weapons Data
```typescript
// server/src/firebase/seeds/seed-weapons.ts
import { db } from "../admin";
import { Weapon } from "../../models/weapon.model";

export async function seedWeapons() {
  const weapons: Weapon[] = [
    {
      id: "mw3-ram7",
      name: "RAM-7",
      game: "MW3",
      category: "AR",
      stats: {
        damage: 75,
        range: 70,
        accuracy: 80,
        fireRate: 78,
        mobility: 65,
        control: 72,
        handling: 70
      },
      ballistics: {
        damageRanges: [
          { range: 0, damage: 34 },
          { range: 25, damage: 30 },
          { range: 40, damage: 24 }
        ],
        ttk: { min: 456, max: 628 },
        fireRate: 845,
        magazineSize: 40,
        reloadTime: 2.1,
        adTime: 245
      },
      attachmentSlots: {
        optic: ["optic-1", "optic-2"],
        barrel: ["barrel-1", "barrel-2"],
        magazine: ["mag-1", "mag-2"],
        underbarrel: ["under-1", "under-2"],
        stock: ["stock-1", "stock-2"]
      },
      meta: {
        tier: "S",
        popularity: 87,
        winRate: 54,
        lastUpdated: new Date().toISOString()
      },
      bestFor: ["Ranked", "Close-Medium range", "Aggressive play"],
      playstyles: ["Aggressive", "Tactical"],
      imageUrl: "https://example.com/ram7.png",
      iconUrl: "https://example.com/ram7-icon.png"
    },
    // Add more weapons...
  ];

  const batch = db().batch();
  
  for (const weapon of weapons) {
    const ref = db().collection("weapons").doc(weapon.id);
    batch.set(ref, weapon);
  }

  await batch.commit();
  console.log(`Seeded ${weapons.length} weapons`);
}
```

## 9. **Deployment Configuration**

### vercel.json
```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/mcp.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/mcp",
      "dest": "/api/mcp.ts",
      "methods": ["POST", "GET", "OPTIONS"]
    }
  ],
  "env": {
    "NODE_ENV": "production",
    "FIREBASE_PROJECT_ID": "@firebase_project_id",
    "FIREBASE_CLIENT_EMAIL": "@firebase_client_email",
    "FIREBASE_PRIVATE_KEY": "@firebase_private_key",
    "FIREBASE_STORAGE_BUCKET": "@firebase_storage_bucket"
  },
  "functions": {
    "api/mcp.ts": {
      "maxDuration": 60,
      "memory": 1024
    }
  }
}
```

### Environment Variables
```env
# .env.local
FIREBASE_PROJECT_ID=cod-loadout-pro
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@cod-loadout-pro.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=cod-loadout-pro.appspot.com

# OAuth
OAUTH_CLIENT_ID=your-oauth-client-id
OAUTH_CLIENT_SECRET=your-oauth-client-secret
OAUTH_REDIRECT_URI=https://cod-loadout-pro.vercel.app/oauth/callback

# App Config
MCP_SERVER_NAME=cod-loadout-pro
MCP_SERVER_VERSION=1.0.0
NODE_ENV=production
```

## 10. **Content Security Policy**

```json
// config/csp.config.json
{
  "connect_domains": [
    "firebasestorage.googleapis.com",
    "firestore.googleapis.com",
    "cod-loadout-pro.vercel.app"
  ],
  "resource_domains": [
    "fonts.googleapis.com",
    "fonts.gstatic.com",
    "cdn.jsdelivr.net",
    "firebasestorage.googleapis.com"
  ]
}
```

## 11. **Testing & Quality Assurance**

### Example Integration Test
```typescript
// server/src/__tests__/search-weapons.test.ts
import { describe, it, expect, beforeAll } from "vitest";
import { searchWeaponsTool } from "../tools/search-weapons";
import { initializeFirebase } from "../firebase/admin";

describe("Search Weapons Tool", () => {
  beforeAll(async () => {
    await initializeFirebase();
  });

  it("searches weapons by category", async () => {
    const result = await searchWeaponsTool.execute(
      {
        category: "AR",
        game: "MW3",
        limit: 5
      },
      {
        userId: "test-user",
        sessionId: "test-session"
      }
    );

    expect(result.structuredContent.weapons).toBeDefined();
    expect(result.structuredContent.weapons.length).toBeGreaterThan(0);
    expect(result.structuredContent.weapons[0].category).toBe("AR");
  });

  it("filters by playstyle", async () => {
    const result = await searchWeaponsTool.execute(
      {
        playstyle: "Aggressive",
        limit: 3
      },
      {
        userId: "test-user",
        sessionId: "test-session"
      }
    );

    expect(result.structuredContent.weapons).toBeDefined();
    // All weapons should support Aggressive playstyle
  });

  it("respects limit parameter", async () => {
    const result = await searchWeaponsTool.execute(
      {
        limit: 3
      },
      {
        userId: "test-user",
        sessionId: "test-session"
      }
    );

    expect(result.structuredContent.weapons.length).toBeLessThanOrEqual(3);
  });
});
```

## 12. **Deployment Checklist**

**Pre-Launch:**
- [ ] Seed Firebase with complete weapon database (MW3, Warzone, BO6)
- [ ] Seed attachments for all weapons
- [ ] Create initial meta snapshots
- [ ] Build and test all UI components
- [ ] Configure CSP for weapon image domains
- [ ] Set up OAuth 2.1 authentication flow
- [ ] Configure Firebase security rules
- [ ] Test all tools with MCP Inspector
- [ ] Verify component rendering in sandbox
- [ ] Set up error logging and monitoring
- [ ] Create user documentation

**Launch:**
- [ ] Deploy to Vercel production
- [ ] Test MCP endpoint at https://cod-loadout-pro.vercel.app/mcp
- [ ] Verify Firebase connection from Vercel
- [ ] Test OAuth flow end-to-end
- [ ] Test all tools in ChatGPT Developer Mode
- [ ] Verify components render correctly
- [ ] Check session management
- [ ] Monitor Firestore usage and costs
- [ ] Submit app for ChatGPT Apps review

**Post-Launch:**
- [ ] Monitor user queries and feedback
- [ ] Update weapon stats weekly
- [ ] Track meta changes and update database
- [ ] Add new weapons as they're released
- [ ] Expand to new CoD titles
- [ ] Add community features (share loadouts, vote on builds)
- [ ] Implement analytics for popular weapons/loadouts

## 13. **Monetization Strategy (Future)**

1. **Premium Features:**
   - Unlimited saved loadouts (free: 5, premium: unlimited)
   - Advanced stat tracking and analytics
   - Early access to meta updates
   - Custom loadout builder with stat calculator

2. **Partnership Opportunities:**
   - Sponsored loadouts from pro players
   - Integration with gaming peripheral brands
   - Tournament loadout recommendations

3. **Affiliate Revenue:**
   - Link to CoD points purchases
   - Gaming gear recommendations

This architecture provides a production-ready COD Loadout Assistant that leverages Firebase for scalable data storage, Vercel for edge deployment, and the MCP protocol for seamless ChatGPT integration. Users get instant, expert loadout recommendations without ever leaving ChatGPT.