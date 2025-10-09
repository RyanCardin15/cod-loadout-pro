# ChatGPT Connector Setup Guide

Follow these exact steps to set up your Counterplay MCP server in ChatGPT.

## Step 1: Deploy Your Changes

First, deploy the updated MCP server with OAuth discovery:

```bash
npm run deploy
```

Wait for deployment to complete.

## Step 2: Open ChatGPT Connector Settings

1. Open ChatGPT
2. Click your profile → **Settings**
3. Navigate to **Connectors** → **Advanced**
4. Enable **Developer mode** (if not already enabled)
5. Click **Add Connector**

## Step 3: Fill in Basic Information

In the "New Connector" dialog:

**Icon:** (optional - upload a 128x128 px image)

**Name:**
```
Counterplay
```

**Description:**
```
Expert Call of Duty weapon loadouts, counters, and meta analysis
```

**MCP Server URL:**
```
https://counterplay.vercel.app/api/mcp
```

## Step 4: Configure Authentication

**Authentication Method:** Select **OAuth**

You'll see a checkbox:
- ✅ **Check** "I trust this application"
  - "Custom connectors are not verified by OpenAI. Malicious developers may attempt to steal your data."

## Step 5: Click "Create"

Click the **Create** button at the bottom.

ChatGPT will now:
1. Fetch OAuth configuration from your MCP server
2. Discover the OAuth endpoints automatically
3. Set up the connector

## Step 6: Authorize the Connector

After creating:

1. You'll see the connector in your list
2. Click **Authorize** or **Connect**
3. You'll be redirected to your authorization page
4. **Sign in with Google** (popup will appear automatically)
5. Complete the sign-in
6. You'll be redirected back to ChatGPT

## Step 7: Test It!

Try these commands in ChatGPT:

```
What's the best loadout for the MCW in Warzone?
```

```
Show me counters for the RAM-7
```

```
Give me a sniper support loadout for Resurgence
```

## Troubleshooting

### Error: "OAuth configuration not found"

**Solution:** Your server needs to be deployed first. Run:
```bash
npm run deploy
```

Then wait 1-2 minutes for Vercel to deploy, and try again.

### Error: "Invalid OAuth endpoints"

**Solution:** Make sure you're using:
- MCP Server URL: `https://counterplay.vercel.app/api/mcp` (not `/mcp`)

### The authorize button redirects but nothing happens

**Possible causes:**
1. **Popup blocker** - Allow popups for your domain
2. **Firebase Auth not configured** - Check that Google auth is enabled in Firebase Console
3. **Domain not authorized** - Add your Vercel domain to Firebase authorized domains

**Check Firebase:**
1. Go to Firebase Console → Authentication → Sign-in method
2. Verify Google is enabled
3. Go to Settings → Authorized domains
4. Add: `counterplay.vercel.app`

### "Authorization failed" error

**Check these:**
1. Firebase credentials are set in Vercel environment variables
2. Your `.env.local` OAuth URLs match your deployed domain
3. The OAuth endpoints are accessible:

```bash
# Test discovery endpoint
curl https://counterplay.vercel.app/api/oauth/.well-known/oauth-authorization-server

# Should return OAuth configuration JSON
```

## Advanced: Manual OAuth Configuration

If automatic discovery fails, you can manually configure OAuth:

**Instead of Step 3-4 above:**

After selecting OAuth authentication, look for "Advanced" or "Manual Configuration" options and enter:

**OAuth Settings:**
- Authorization URL: `https://counterplay.vercel.app/api/oauth/authorize`
- Token URL: `https://counterplay.vercel.app/api/oauth/token`
- Revocation URL: `https://counterplay.vercel.app/api/oauth/revoke`
- Client ID: `chatgpt-apps-sdk`
- Client Secret: (leave empty)
- Scope: `read write profile`
- Token Type: `Bearer`
- Auth Method: `none` (PKCE)

## Success Indicators

You know it's working when:

✅ Connector shows "Connected" status
✅ You can ask about weapon loadouts
✅ The MCP server responds with detailed information
✅ Your user profile is created in Firestore

## Getting Help

If you're still having issues:

1. Check Vercel function logs for errors
2. Check browser console for errors during authorization
3. Verify all environment variables are set correctly
4. Review the [Full OAuth Setup Guide](./OAUTH_SETUP.md)

---

**Quick Checklist:**
- [ ] Code deployed to Vercel
- [ ] MCP Server URL: `https://counterplay.vercel.app/api/mcp`
- [ ] Authentication: OAuth selected
- [ ] "I trust this application" checked
- [ ] Connector created
- [ ] Authorization completed with Google
- [ ] Test query successful
