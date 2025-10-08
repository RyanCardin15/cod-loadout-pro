# OAuth Setup for ChatGPT Apps SDK

This guide explains how to set up OAuth authentication for your Counterplay MCP Server to work with ChatGPT's Apps SDK.

## Overview

The Counterplay MCP Server implements OAuth 2.1 with PKCE (Proof Key for Code Exchange) to provide secure authentication for ChatGPT and other MCP clients. The implementation uses Firebase Authentication with Google as the identity provider, allowing users to automatically sign in or create accounts when launching the app.

## Architecture

```
ChatGPT → OAuth Flow → Google Sign-In → Firebase Auth → MCP Server
```

**Key Components:**

1. **OAuth Provider** (`server/src/auth/oauth-provider.ts`): Implements OAuth 2.1 server logic
2. **OAuth Endpoints** (`api/oauth.ts`): Exposes authorization, token, and revocation endpoints
3. **Authorization Page** (`web/src/app/auth/authorize/page.tsx`): Handles Google Sign-In UI
4. **Clients Store** (`server/src/auth/clients-store.ts`): Manages registered OAuth clients
5. **MCP Server** (`api/mcp.ts`): Validates tokens and executes authenticated tool calls

## Setup Instructions

### 1. Configure Environment Variables

Update your `.env.local` file with the following OAuth configuration:

```bash
# OAuth Configuration
OAUTH_ISSUER_URL=https://your-app.vercel.app
OAUTH_BASE_URL=https://your-app.vercel.app/api/oauth
OAUTH_AUTHORIZATION_PAGE_URL=https://your-app.vercel.app/auth/authorize
OAUTH_DOCS_URL=https://your-app.vercel.app/docs
OAUTH_CHATGPT_CLIENT_ID=chatgpt-apps-sdk
OAUTH_DEV_CLIENT_ID=counterplay-dev
```

Replace `your-app.vercel.app` with your actual deployment URL.

### 2. Install Required Dependencies

Ensure you have `@vercel/kv` installed for session management:

```bash
npm install @vercel/kv
```

### 3. Set Up Vercel KV

1. Go to your Vercel project dashboard
2. Navigate to Storage → Create Database → KV
3. Link the KV database to your project
4. The environment variables will be automatically added

### 4. Configure Firebase Authentication

1. **Enable Google Sign-In:**
   - Go to Firebase Console → Authentication → Sign-in method
   - Enable Google provider
   - Add your domain to authorized domains

2. **Get Firebase Config:**
   - Copy your Firebase client config (already in your `.env.local`)
   - Ensure `NEXT_PUBLIC_FIREBASE_*` variables are set

### 5. Register Your App in ChatGPT

1. **Open ChatGPT Developer Mode:**
   - Go to ChatGPT Settings → Connectors → Advanced → Developer mode

2. **Add Custom Connector:**
   - Click "Add Connector"
   - Select "OAuth 2.1"

3. **Configure OAuth Settings:**

   **Basic Info:**
   - Name: `Counterplay`
   - Description: `Expert Call of Duty weapon loadouts, counters, and meta analysis`
   - Base URL: `https://your-app.vercel.app/api/mcp`

   **OAuth Settings:**
   - Authorization URL: `https://your-app.vercel.app/api/oauth/authorize`
   - Token URL: `https://your-app.vercel.app/api/oauth/token`
   - Revocation URL: `https://your-app.vercel.app/api/oauth/revoke`
   - Scope: `read write profile`
   - Token Type: `Bearer`

   **Client Configuration:**
   - Client ID: `chatgpt-apps-sdk` (or your custom client ID)
   - Client Secret: (leave empty - PKCE only, no client secret needed)
   - Authentication Method: `none` (PKCE)

4. **Save and Test:**
   - Click "Save"
   - Click "Authorize" to test the OAuth flow
   - You should be redirected to your authorization page
   - Sign in with Google
   - You'll be redirected back to ChatGPT

## OAuth Flow

### 1. Authorization Request

ChatGPT initiates the OAuth flow:

```
GET https://your-app.vercel.app/api/oauth/authorize?
  client_id=chatgpt-apps-sdk&
  response_type=code&
  redirect_uri=https://chatgpt.com/oauth/callback&
  scope=read write profile&
  state=xyz&
  code_challenge=abc123&
  code_challenge_method=S256
```

### 2. User Authorization

The user is redirected to your authorization page where they:
- See the authorization request details
- Automatically sign in with Google (or manually trigger sign-in)
- Grant permission for ChatGPT to access their account

### 3. Authorization Code Exchange

After successful sign-in:
1. The authorization page calls your backend to associate the code with the user
2. The user is redirected back to ChatGPT with the authorization code
3. ChatGPT exchanges the code for an access token

### 4. Token Usage

ChatGPT uses the access token to make authenticated requests to your MCP server:

```
POST https://your-app.vercel.app/api/mcp
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "get-loadout",
    "arguments": {
      "weaponName": "MCW"
    }
  }
}
```

## Automatic Sign-In Flow

For the best user experience with the Apps SDK, the authorization page automatically initiates Google Sign-In:

1. User clicks "Authorize" in ChatGPT
2. Redirected to your authorization page
3. **Automatic Google Sign-In popup appears**
4. User signs in (or account is created automatically)
5. Immediately redirected back to ChatGPT
6. Ready to use the tools!

This creates a seamless experience where users can start using your MCP server in ChatGPT with minimal friction.

## Security Features

- **OAuth 2.1 with PKCE**: Protects against authorization code interception
- **Short-lived tokens**: Access tokens expire after 1 hour
- **Firebase ID tokens**: Cryptographically signed tokens that can't be forged
- **Automatic cleanup**: Expired authorization codes are removed automatically
- **Secure storage**: User associations stored in Vercel KV with TTL

## Testing OAuth Flow

### Local Testing

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Test authorization endpoint:**
   ```bash
   curl "http://localhost:3000/api/oauth/.well-known/oauth-authorization-server"
   ```

3. **Test authorization page:**
   Open in browser:
   ```
   http://localhost:3000/auth/authorize?client_id=counterplay-dev&code=test123&redirect_uri=http://localhost:3000/oauth/callback
   ```

### Production Testing

1. **Deploy to Vercel:**
   ```bash
   vercel --prod
   ```

2. **Test OAuth discovery:**
   ```bash
   curl "https://your-app.vercel.app/api/oauth/.well-known/oauth-authorization-server"
   ```

3. **Test in ChatGPT:**
   - Follow the setup instructions above
   - Click "Authorize" in ChatGPT
   - Complete the sign-in flow
   - Try using a tool

## Troubleshooting

### "Invalid authorization code"

- Check that Vercel KV is properly configured
- Verify authorization codes aren't expired (10-minute TTL)
- Ensure the code hasn't been used already

### "Token verification failed"

- Verify Firebase credentials are correct
- Check that the token is properly formatted as `Bearer <token>`
- Ensure the token hasn't expired

### "Redirect URI mismatch"

- Verify the redirect URI in your OAuth client registration matches exactly
- Check that ChatGPT's callback URL is registered in your clients store

### Google Sign-In fails

- Check Firebase Auth is properly configured
- Verify your domain is added to Firebase authorized domains
- Ensure Firebase client config environment variables are set

## Advanced Configuration

### Custom OAuth Client

To add a custom OAuth client (not ChatGPT):

```typescript
// In server/src/auth/clients-store.ts
const customClient: OAuthClientInformationFull = {
  client_id: 'my-custom-client',
  client_name: 'My Custom Client',
  redirect_uris: ['https://my-app.com/callback'],
  grant_types: ['authorization_code', 'refresh_token'],
  response_types: ['code'],
  scope: 'read write',
  token_endpoint_auth_method: 'none',
};

this.clients.set(customClient.client_id, customClient);
```

### Custom Token Expiration

To change access token expiration:

```typescript
// In server/src/auth/oauth-provider.ts
return {
  access_token: accessToken,
  token_type: 'Bearer',
  expires_in: 7200, // 2 hours instead of 1
  refresh_token: refreshToken,
  scope: state.scopes.join(' '),
};
```

### Disable Automatic Sign-In

To require manual sign-in button click:

```typescript
// In web/src/app/auth/authorize/page.tsx
const [autoSignIn, setAutoSignIn] = useState(false); // Change to false
```

## Resources

- [OAuth 2.1 Specification](https://oauth.net/2.1/)
- [PKCE Specification](https://oauth.net/2/pkce/)
- [MCP SDK Documentation](https://github.com/modelcontextprotocol/typescript-sdk)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [ChatGPT Apps SDK](https://developers.openai.com/apps-sdk)
