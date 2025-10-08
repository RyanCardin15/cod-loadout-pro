# MCP ChatGPT Integration - Fix Summary

## Problem
The MCP server widgets were appearing as blank/empty iframes in ChatGPT because the component bundle was missing.

## Root Cause
1. **Missing Component Bundle**: The widget components were created but never built into a UMD bundle
2. **Wrong Bundle Location**: The bundle was generated at `web/web/dist/` instead of `web/dist/`
3. **Missing Dependencies**: Vite and terser weren't installed for building the components

## What Was Fixed

### 1. Created MCP Widget Components
Created React components for all MCP widgets in `web/src/mcp-widgets/`:
- `MetaTierList.tsx` - Displays MW3 meta tier list with weapons, usage rates, and recent changes
- `LoadoutCard.tsx` - Shows recommended loadout with attachments
- `CounterSuggestions.tsx` - Provides counter strategies
- `MyLoadouts.tsx` - Lists saved loadouts
- `PlaystyleProfile.tsx` - Displays playstyle analysis
- `WeaponList.tsx` - Shows weapon recommendations
- `index.tsx` - Entry point that exports all components to `window.CODLoadoutComponents`

### 2. Set Up Build Configuration
- Created `web/vite.config.mcp.ts` for building UMD bundle
- Added build scripts to `web/package.json`:
  - `build:mcp` - Build widget components only
  - `build:all` - Build both widgets and Next.js app
- Installed dependencies: `vite`, `@vitejs/plugin-react`, `terser`

### 3. Built and Deployed Component Bundle
- Generated `web/dist/counterplay-components.umd.js` (457KB)
- Bundle includes React, ReactDOM, and all widget components
- Components attach to `window.CODLoadoutComponents` for iframe access

### 4. Created Next.js API Route
- Added `web/src/app/api/mcp/route.ts` for development access
- Forwards requests to the Vercel function in production

## How MCP Integration Works

### Server Side (`/api/mcp.ts`):
1. Handles MCP protocol requests (initialize, tools/list, tools/call)
2. Loads component bundle from `web/dist/counterplay-components.umd.js`
3. Generates HTML templates that embed the bundle
4. Returns widget templates when ChatGPT requests resources

### Widget Templates (`server/src/resources/templates.ts`):
1. Creates HTML wrapper with COD-themed CSS
2. Embeds the component bundle JavaScript
3. Initializes React components with proper root elements
4. Connects to `window.openai` bridge for data

### Component Rendering:
1. ChatGPT calls MCP tool (e.g., `get_meta`)
2. Server returns `structuredContent` (for AI) and references template URI
3. ChatGPT loads template HTML in sandboxed iframe
4. Component bundle initializes and reads data from `window.openai.toolOutput`
5. React component renders with the data

## Testing the Integration

### Build Commands:
```bash
# Build widget components
cd web
npm run build:mcp

# Build everything
cd web
npm run build:all

# Build server
cd ../server
npm run build
```

### Deploy to Vercel:
```bash
npm run deploy
```

### ChatGPT Integration:
1. Deploy to Vercel (must be publicly accessible)
2. Configure MCP server in ChatGPT with URL: `https://your-domain.vercel.app/mcp`
3. Test by asking: "What's the MW3 meta?"
4. ChatGPT will call the `get_meta` tool and display the MetaTierList widget

## File Structure
```
/api/mcp.ts                          # Vercel function - MCP server handler
/server/src/
  ├── resources/templates.ts         # Widget HTML template generator
  ├── tools/
  │   ├── get-meta.ts               # Meta tier list tool
  │   └── registry.ts               # Tool registry
/web/
  ├── dist/counterplay-components.umd.js  # Component bundle (generated)
  ├── src/mcp-widgets/
  │   ├── MetaTierList.tsx          # Meta tier list component
  │   ├── LoadoutCard.tsx           # Loadout display component
  │   ├── CounterSuggestions.tsx    # Counter strategies component
  │   ├── MyLoadouts.tsx            # Saved loadouts component
  │   ├── PlaystyleProfile.tsx      # Playstyle analysis component
  │   ├── WeaponList.tsx            # Weapon list component
  │   └── index.tsx                 # Entry point
  ├── vite.config.mcp.ts            # Vite config for building components
  └── src/app/api/mcp/route.ts     # Next.js API route (dev proxy)
```

## Next Steps
1. Commit changes to git
2. Deploy to Vercel with `npm run deploy`
3. Test in ChatGPT by configuring the MCP server
4. Enhance components with more interactivity and styling

## Component Bundle Details
- **Size**: 457KB (uncompressed)
- **Includes**: React 18.3, ReactDOM, all widget components
- **Format**: UMD (Universal Module Definition)
- **Global**: `window.CODLoadoutComponents`
- **Minified**: Yes (with Terser)

## Known Issues
- Development mode requires Vercel dev server for MCP testing
- Component bundle must be rebuilt after widget changes
- Templates currently use inline CSS (could be optimized)
