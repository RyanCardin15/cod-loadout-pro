# Counterplay URL Structure

## Production URLs

### Web Application (Root)
- **URL**: https://counterplay-cb98uapv2-ryancardin15s-projects.vercel.app/
- **Purpose**: Main web application for users
- **Pages**:
  - `/` - Landing page
  - `/weapons` - Weapon browser
  - `/loadouts` - Loadout builder
  - `/meta` - Meta tier lists
  - `/counters` - Counter strategies
  - `/profile` - User profile

### MCP Server
- **URL**: https://counterplay-cb98uapv2-ryancardin15s-projects.vercel.app/mcp
- **Purpose**: Model Context Protocol server for ChatGPT integration
- **Methods**: POST, GET, OPTIONS
- **Protocol**: MCP 2024-11-05

## Configuration

The routing is configured in `vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "web/package.json",
      "use": "@vercel/next"
    },
    {
      "src": "api/mcp.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/mcp",
      "dest": "/api/mcp.ts"
    },
    {
      "handle": "filesystem"
    },
    {
      "src": "/(.*)",
      "dest": "/web/$1"
    }
  ]
}
```

### How It Works:

1. **`/mcp` route**: Requests to `/mcp` are routed to the Vercel serverless function at `/api/mcp.ts`
2. **`filesystem` handler**: Serves static files from the Next.js build
3. **Catch-all route**: All other requests are routed to the Next.js app in `/web`

## ChatGPT MCP Configuration

When configuring the MCP server in ChatGPT, use:

```
URL: https://counterplay-cb98uapv2-ryancardin15s-projects.vercel.app/mcp
Method: POST
Protocol: MCP 2024-11-05
```

## Available MCP Tools

1. **search_weapons** - Find best weapons by criteria
2. **get_loadout** - Build complete loadout with attachments
3. **counter_loadout** - Counter enemy weapons/loadouts
4. **analyze_playstyle** - Get personalized recommendations
5. **get_meta** - Current meta tier lists
6. **save_loadout** - Save favorite loadouts
7. **my_loadouts** - View saved loadouts
8. **get_my_profile** - Get user profile (requires auth)
9. **update_profile** - Update user profile (requires auth)
10. **profile_stats** - Get user statistics (requires auth)

## Widget Components

MCP widgets are served from the component bundle at:
- `/web/dist/counterplay-components.umd.js` (457KB)

Available widgets:
- MetaTierList - Tier list with S/A/B/C/D rankings
- LoadoutCard - Complete loadout display
- CounterSuggestions - Counter strategies
- MyLoadouts - Saved loadouts list
- PlaystyleProfile - Playstyle analysis
- WeaponList - Weapon recommendations

## Custom Domain (Future)

To use a custom domain like `counterplay.gg`:

1. Add domain in Vercel project settings
2. Update DNS records to point to Vercel
3. URLs will become:
   - Web: https://counterplay.gg/
   - MCP: https://counterplay.gg/mcp

No code changes needed - the routing configuration will work the same.
