// GET /api/oauth/callback
// Handles OAuth callback, exchanges code for tokens, fetches user info, redirects to analysis

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // Get code and state from query params
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  // Handle OAuth errors from Roblox
  if (error) {
    const errorDesc = url.searchParams.get('error_description') || error;
    console.error('OAuth error from Roblox:', errorDesc);
    return redirectWithError('oauth_denied');
  }

  if (!code || !state) {
    return redirectWithError('missing_params');
  }

  // Get state from cookie
  const cookies = parseCookies(request.headers.get('Cookie') || '');
  const savedState = cookies.oauth_state;

  if (!savedState || savedState !== state) {
    console.error('State mismatch:', { savedState, state });
    return redirectWithError('state_mismatch');
  }

  // Exchange code for tokens
  const clientId = env.ROBLOX_CLIENT_ID;
  const clientSecret = env.ROBLOX_CLIENT_SECRET;
  const redirectUri = env.ROBLOX_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return redirectWithError('not_configured');
  }

  try {
    // Token exchange
    const tokenResponse = await fetch('https://apis.roblox.com/oauth/v1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(`${clientId}:${clientSecret}`)
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', tokenResponse.status, errorText);
      return redirectWithError('token_exchange_failed');
    }

    const tokens = await tokenResponse.json();
    const accessToken = tokens.access_token;

    if (!accessToken) {
      console.error('No access token in response');
      return redirectWithError('no_access_token');
    }

    // Fetch user info from Roblox
    const userInfoResponse = await fetch('https://apis.roblox.com/oauth/v1/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!userInfoResponse.ok) {
      const errorText = await userInfoResponse.text();
      console.error('UserInfo fetch failed:', userInfoResponse.status, errorText);
      return redirectWithError('userinfo_failed');
    }

    const userInfo = await userInfoResponse.json();

    // Extract user data
    // Roblox userinfo returns: sub (user id), name (username), nickname (display name), preferred_username
    const userId = userInfo.sub;
    const username = userInfo.preferred_username || userInfo.name;
    const displayName = userInfo.nickname || userInfo.name;

    // Clear oauth_state cookie and redirect to analyze with verified user
    return new Response(null, {
      status: 302,
      headers: {
        'Location': `/?oauth=success&userId=${userId}&username=${encodeURIComponent(username)}&displayName=${encodeURIComponent(displayName)}`,
        'Set-Cookie': 'oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0'
      }
    });

  } catch (err) {
    console.error('OAuth callback error:', err);
    return redirectWithError('server_error');
  }
}

function redirectWithError(error) {
  return new Response(null, {
    status: 302,
    headers: {
      'Location': `/?oauth=error&reason=${error}`,
      'Set-Cookie': 'oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0'
    }
  });
}

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;

  cookieHeader.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.trim().split('=');
    if (name) {
      cookies[name] = rest.join('=');
    }
  });

  return cookies;
}
