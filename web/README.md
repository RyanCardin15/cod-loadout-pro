# COD Loadout Pro - Web App

> Spectacular, professional, and modern UI for the COD Loadout Pro MCP server.

## 🚀 Quick Start

### Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the app.

### Build for Production

```bash
npm run build
npm start
```

## 🎨 Features

### Implemented ✅
- **Landing Page** - Immersive hero with animated gradients and top weapons showcase
- **Navigation** - Responsive desktop and mobile navigation with smooth transitions
- **Design System** - Complete COD-themed design with glassmorphism, neon glows, and tactical aesthetics
- **API Client** - Type-safe wrapper for MCP server communication
- **Animations** - Smooth Framer Motion animations throughout

### Coming Soon 🔜
- **Weapons Catalog** - Browse and filter all weapons
- **Loadout Builder** - Interactive attachment builder with 3D previews
- **Meta Dashboard** - Live tier lists and analytics
- **Counter Strategies** - Matchup analyzer
- **User Profile** - Saved loadouts and stats

## 🏗️ Architecture

### Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **State**: React Query + Zustand
- **3D**: Three.js + React Three Fiber
- **Charts**: Recharts
- **Backend**: Firebase + MCP Server

### Directory Structure

```
src/
├── app/                    # Next.js app routes
│   ├── (landing)/         # Landing page
│   ├── weapons/           # Weapons catalog
│   ├── loadouts/          # Loadout builder
│   ├── meta/              # Meta dashboard
│   ├── counters/          # Counter strategies
│   └── profile/           # User profile
├── components/
│   ├── ui/                # Reusable UI components
│   ├── landing/           # Landing page sections
│   ├── 3d/                # 3D weapon viewers
│   ├── charts/            # Data visualizations
│   └── [feature]/         # Feature-specific components
└── lib/
    ├── api-client.ts      # MCP server API
    ├── firebase.ts        # Firebase client
    ├── hooks/             # Custom React hooks
    └── utils/             # Utility functions
```

## 🎨 Design System

### Colors
```css
--cod-orange: #FF6B00    /* Primary */
--cod-blue: #00D4FF      /* Secondary */
--cod-green: #00FF88     /* Success */
--cod-black: #0A0A0A     /* Background */
--cod-gray: #1A1A1A      /* Surface */
```

### Typography
- **Display**: Rajdhani (tactical/military feel)
- **Body**: Inter (clean, readable)
- **Mono**: JetBrains Mono (stats, code)

### Custom Classes
- `.glass` - Glassmorphism effect
- `.neon-glow` - Neon glow effect
- `.hud-corner` - Tactical HUD brackets
- `.gradient-text` - Orange/Blue/Green gradient
- `.btn-primary` - Primary button style
- `.btn-ghost` - Ghost button style
- `.card-glow` - Card with glow effect
- `.tier-S` through `.tier-D` - Tier badges

## 🔌 MCP Server Integration

The web app connects to the existing MCP server:

```typescript
import { api } from '@/lib/api-client';

// Search weapons
const weapons = await api.searchWeapons({
  game: 'MW3',
  category: 'AR',
  tier: 'S'
});

// Get loadout
const loadout = await api.getLoadout({
  weaponId: 'mcw',
  playstyle: 'Aggressive'
});

// Get meta
const meta = await api.getMeta({
  game: 'Warzone'
});
```

All API methods are type-safe and match the MCP tool definitions.

## 📦 Environment Variables

Create `.env.local`:

```env
# MCP Server
NEXT_PUBLIC_MCP_ENDPOINT=/api/mcp

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

## 🎯 Key Features

### Landing Page
- ✨ Animated hero with gradient background
- 📊 Live top weapons showcase
- 🎯 Feature grid with hover effects
- 📈 Meta changes preview
- 🚀 Strong CTAs
- 📱 Perfect mobile responsiveness

### Navigation
- Desktop navigation with active state indicators
- Mobile hamburger menu
- Bottom navigation bar for mobile
- Smooth page transitions with Framer Motion

### Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Touch-optimized buttons (48px minimum)
- Adaptive layouts for all screen sizes

## 🚀 Deployment

### Vercel (Recommended)

```bash
vercel deploy
```

The app is optimized for Vercel with:
- Edge functions support
- Automatic image optimization
- Static page generation where possible
- Incremental static regeneration for dynamic content

### Environment Variables
Set all `NEXT_PUBLIC_*` variables in your deployment platform.

## 📊 Performance

### Optimizations
- Next.js Image optimization
- Code splitting by route
- Component lazy loading
- React Query caching
- Edge caching with ISR

### Targets
- Lighthouse Performance: >95
- First Contentful Paint: <1.5s
- Time to Interactive: <3s
- Cumulative Layout Shift: <0.1

## 🧪 Testing

Counterplay has a comprehensive test suite with >60% coverage across the codebase.

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests in CI mode
npm run test:ci
```

### Test Structure

```
__tests__/
├── setup/                 # Test utilities and mocks
│   ├── testUtils.tsx     # Custom render with providers
│   ├── mocks.ts          # Mock data factories
│   └── firebase-mock.ts  # Firebase mocks
├── components/           # Component tests
│   ├── WeaponCard.test.tsx
│   ├── LoadoutCard.test.tsx
│   ├── ErrorBoundary.test.tsx
│   └── ErrorFallback.test.tsx
├── hooks/                # Custom hook tests
│   ├── useWeapons.test.tsx
│   ├── useLoadouts.test.tsx
│   └── useMeta.test.tsx
└── lib/                  # Utility tests
    ├── logger.test.ts
    ├── env.test.ts
    ├── errors.test.ts
    └── rateLimit.test.ts
```

### Coverage Targets

- **Overall**: >60% statements, branches, functions, lines
- **Utilities** (`src/lib/**`): >80% coverage
- **Hooks** (`src/hooks/**`): >70% coverage
- **Components**: >60% coverage

### Testing Guidelines

See [docs/TESTING.md](./docs/TESTING.md) for:
- Writing new tests
- Testing best practices
- Mocking strategies
- Coverage requirements
- CI/CD integration

### Development

```bash
# Run development server
npm run dev

# Build and test production bundle
npm run build
npm start

# Lint code
npm run lint

# Type check
npx tsc --noEmit
```

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details

---

**Built with ❤️ for Call of Duty players**
