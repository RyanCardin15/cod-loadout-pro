# OAuth Deployment Checklist

Your OAuth implementation is built and ready to deploy! Follow these steps:

## ✅ Pre-Deployment (Completed)

- [x] Install dependencies
- [x] Build server and web
- [x] OAuth provider implementation
- [x] Authorization page created
- [x] Firestore code store configured
- [x] Environment variables documented

## 🚀 Deployment Steps

### 1. Deploy to Vercel

```bash
npm run deploy
```

Or push to GitHub for automatic deployment.

### 2. Configure Firebase Auth

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `cod-loadout-pro`
3. Navigate to **Authentication** → **Sign-in method**
4. Enable **Google** provider (if not already enabled)
5. Add authorized domain:
   - Click **Authorized domains**
   - Add: `counterplay.vercel.app` (or your custom domain)

### 3. Update Environment Variables

After deployment, update your `.env.local` or Vercel environment variables:

```bash
OAUTH_ISSUER_URL=https://counterplay.vercel.app
OAUTH_BASE_URL=https://counterplay.vercel.app/api/oauth
OAUTH_AUTHORIZATION_PAGE_URL=https://counterplay.vercel.app/auth/authorize
OAUTH_DOCS_URL=https://counterplay.vercel.app/docs
```

### 4. Test OAuth Endpoints

After deployment, verify these endpoints work:

```bash
# OAuth discovery document
curl https://counterplay.vercel.app/api/oauth/.well-known/oauth-authorization-server

# MCP server health check
curl https://counterplay.vercel.app/api/mcp

# Should return server info
```

### 5. Set Up in ChatGPT

1. Open ChatGPT → Settings → Connectors
2. Enable Developer mode
3. Add Custom Connector with OAuth 2.1
4. Use these settings:

**Basic Info:**
- Name: `Counterplay`
- Description: `Expert Call of Duty weapon loadouts, counters, and meta analysis`
- Base URL: `https://counterplay.vercel.app/api/mcp`

**OAuth Configuration:**
- Authorization URL: `https://counterplay.vercel.app/api/oauth/authorize`
- Token URL: `https://counterplay.vercel.app/api/oauth/token`
- Revocation URL: `https://counterplay.vercel.app/api/oauth/revoke`
- Client ID: `chatgpt-apps-sdk`
- Client Secret: (leave empty)
- Scope: `read write profile`
- Token Type: `Bearer`
- Authentication Method: `none` (PKCE)

5. Click **Save** → **Authorize**
6. Sign in with Google
7. Test with: "What's the best loadout for the MCW?"

## 🧪 Testing

### Local Testing

```bash
# Start dev server
npm run dev

# Test authorization page
open http://localhost:3000/auth/authorize?client_id=counterplay-dev&code=test123&redirect_uri=http://localhost:3000/callback
```

### Production Testing

```bash
# Test OAuth discovery
curl https://counterplay.vercel.app/api/oauth/.well-known/oauth-authorization-server | jq

# Test MCP server
curl -X POST https://counterplay.vercel.app/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"initialize","id":1,"params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}'
```

## 🔍 Troubleshooting

### "Authorization failed"
- Verify all OAuth URLs are correct in ChatGPT settings
- Check Firebase Auth is enabled
- Ensure domain is added to Firebase authorized domains

### "Invalid client_id"
- Client ID should be `chatgpt-apps-sdk`
- Check `server/src/auth/clients-store.ts` for registered clients

### Google Sign-In fails
- Verify Firebase client config environment variables
- Check browser console for errors
- Ensure popup blockers aren't blocking the sign-in

### "Token verification failed"
- Check Firebase Admin credentials are set
- Verify token format is `Bearer <token>`
- Check server logs for detailed error

## 📝 Post-Deployment

After successful deployment:

1. **Test the full flow:**
   - Authorize in ChatGPT
   - Sign in with Google
   - Ask for a weapon loadout
   - Verify user profile is created in Firestore

2. **Monitor Firestore:**
   - Check `oauth_codes` collection for code storage
   - Check `users` collection for user profiles
   - Set up index for `expiresAt` field on `oauth_codes`

3. **Set up monitoring:**
   - Monitor Vercel function logs
   - Set up alerts for failed authorizations
   - Track OAuth endpoint usage

## 🎉 Success Criteria

Your OAuth implementation is working when:

- ✅ ChatGPT can authorize successfully
- ✅ Users can sign in with Google
- ✅ Access tokens are validated
- ✅ MCP tools execute with user context
- ✅ User profiles are created automatically

## 📚 Documentation

- [Quick Start Guide](./QUICK_START_OAUTH.md)
- [Full OAuth Setup](./OAUTH_SETUP.md)
- [MCP SDK Docs](https://github.com/modelcontextprotocol/typescript-sdk)
