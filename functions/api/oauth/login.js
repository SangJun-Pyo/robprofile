// GET /api/oauth/login
// Starts OAuth flow by redirecting to Roblox authorize URL

export async function onRequestGet(context) {
  const { env } = context;

  // Validate required environment variables
  const clientId = env.ROBLOX_CLIENT_ID;
  const redirectUri = env.ROBLOX_REDIRECT_URI;
  const scopes = env.OAUTH_SCOPES || 'openid profile';

  if (!clientId || !redirectUri) {
    return new Response(
      JSON.stringify({ error: 'OAuth not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Generate random state for CSRF protection
  const state = crypto.randomUUID();

  // Build authorization URL
  const authorizeUrl = new URL('https://apis.roblox.com/oauth/v1/authorize');
  authorizeUrl.searchParams.set('client_id', clientId);
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('redirect_uri', redirectUri);
  authorizeUrl.searchParams.set('scope', scopes);
  authorizeUrl.searchParams.set('state', state);

  // Set state cookie and redirect
  return new Response(null, {
    status: 302,
    headers: {
      'Location': authorizeUrl.toString(),
      'Set-Cookie': `oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`
    }
  });
}
