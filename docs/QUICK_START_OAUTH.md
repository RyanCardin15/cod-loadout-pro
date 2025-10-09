# Quick Start: OAuth for ChatGPT Apps SDK

Get your Counterplay MCP Server running with OAuth authentication in ChatGPT in just a few minutes!

## Prerequisites

- Node.js 18+ installed
- Vercel account
- Firebase project with Google Auth enabled
- Access to ChatGPT Developer Mode

## Step 1: Install Dependencies

```bash
npm install
```

This will install all required dependencies including `@vercel/kv` for session management.

## Step 2: Set Up Vercel KV

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project (or create a new one)
3. Navigate to **Storage** → **Create Database** → **KV**
4. Click **Create** and link it to your project
5. Environment variables will be automatically added

## Step 3: Configure Environment Variables

Your `.env.local` should already have the OAuth configuration. Just verify these values match your deployment:

```bash
OAUTH_ISSUER_URL=https://your-app.vercel.app
OAUTH_BASE_URL=https://your-app.vercel.app/api/oauth
OAUTH_AUTHORIZATION_PAGE_URL=https://your-app.vercel.app/auth/authorize
```

Replace `your-app` with your actual Vercel project name.

## Step 4: Deploy to Vercel

```bash
npm run deploy
```

Or push to GitHub and deploy through Vercel's Git integration.

## Step 5: Enable Firebase Google Auth

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Authentication** → **Sign-in method**
4. Enable **Google** provider
5. Add your Vercel domain to **Authorized domains**:
   - `your-app.vercel.app`

## Step 6: Set Up in ChatGPT

1. **Open ChatGPT Settings:**
   - Click your profile → Settings
   - Go to **Connectors** → **Advanced**
   - Enable **Developer mode**

2. **Add Custom Connector:**
   - Click **Add Connector**
   - Select **OAuth 2.1**

3. **Fill in the details:**

   **Basic Information:**
   ```
   Name: Counterplay
   Description: Expert Call of Duty weapon loadouts, counters, and meta analysis
   Base URL: https://your-app.vercel.app/api/mcp
   ```

   **OAuth Configuration:**
   ```
   Authorization URL: https://your-app.vercel.app/api/oauth/authorize
   Token URL: https://your-app.vercel.app/api/oauth/token
   Revocation URL: https://your-app.vercel.app/api/oauth/revoke
   Client ID: chatgpt-apps-sdk
   Client Secret: (leave empty)
   Scope: read write profile
   Token Type: Bearer
   Authentication Method: none (PKCE)
   ```

4. **Save and Authorize:**
   - Click **Save**
   - Click **Authorize**
   - You'll be redirected to your auth page
   - Sign in with Google
   - You'll be redirected back to ChatGPT

## Step 7: Test It!

In ChatGPT, try asking:

> "What's the best loadout for the MCW in Warzone?"

> "Show me counters for the RAM-7"

> "Give me a sniper support loadout for Resurgence"

## Troubleshooting

### "Authorization failed"

- Check that all OAuth URLs are correct
- Verify Firebase Auth is enabled
- Ensure Vercel KV is set up and linked

### "Invalid client_id"

- Make sure you're using `chatgpt-apps-sdk` as the client ID
- Check the clients store configuration in `server/src/auth/clients-store.ts`

### "Token verification failed"

- Verify Firebase credentials are set in environment variables
- Check that the token is being passed correctly

### Google Sign-In doesn't work

- Ensure Firebase Auth is properly configured
- Verify your domain is added to Firebase authorized domains
- Check Firebase client config in `.env.local`

## Next Steps

- Read the full [OAuth Setup Guide](./OAUTH_SETUP.md) for advanced configuration
- Explore the MCP tools available
- Customize the authorization page UI
- Add custom OAuth clients

## Support

For issues or questions:
- Check the [OAuth Setup Guide](./OAUTH_SETUP.md)
- Review the [MCP SDK Documentation](https://github.com/modelcontextprotocol/typescript-sdk)
- Open an issue on GitHub

---

**That's it!** Your MCP server is now secured with OAuth and ready to use in ChatGPT. 🎉
