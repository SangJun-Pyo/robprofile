// GET /api/analyze/:userId
// Fetch all analysis data for a Roblox user

const ROBLOX_USERS_API = 'https://users.roblox.com';
const ROBLOX_THUMBNAILS_API = 'https://thumbnails.roblox.com';
const ROBLOX_BADGES_API = 'https://badges.roblox.com';
const ROBLOX_GROUPS_API = 'https://groups.roblox.com';

async function fetchJSON(url) {
  const response = await fetch(url, {
    headers: { 'Accept': 'application/json' }
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

export async function onRequestGet(context) {
  try {
    const userId = context.params.userId;

    if (!userId || isNaN(userId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid user ID' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch all data in parallel
    const [profileResult, avatarResult, badgesResult, groupsResult] = await Promise.allSettled([
      fetchJSON(`${ROBLOX_USERS_API}/v1/users/${userId}`),
      fetchJSON(`${ROBLOX_THUMBNAILS_API}/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png`),
      fetchJSON(`${ROBLOX_BADGES_API}/v1/users/${userId}/badges?limit=100&sortOrder=Desc`),
      fetchJSON(`${ROBLOX_GROUPS_API}/v1/users/${userId}/groups/roles`)
    ]);

    // Check if profile fetch failed (critical)
    if (profileResult.status === 'rejected') {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const profile = profileResult.value;

    // Extract avatar URL (optional)
    let avatarUrl = null;
    if (avatarResult.status === 'fulfilled' && avatarResult.value.data?.[0]) {
      avatarUrl = avatarResult.value.data[0].imageUrl;
    }

    // Extract badges (optional)
    const badges = badgesResult.status === 'fulfilled' ? (badgesResult.value.data || []) : [];

    // Extract groups (optional)
    const groups = groupsResult.status === 'fulfilled' ? (groupsResult.value.data || []) : [];

    return new Response(
      JSON.stringify({
        profile,
        avatarUrl,
        badges,
        groups
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Analyze error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
