// POST /api/users/resolve
// Resolve Roblox username to user ID

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const { username } = body;

    if (!username) {
      return new Response(
        JSON.stringify({ error: 'Username required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Call Roblox API
    const response = await fetch('https://users.roblox.com/v1/usernames/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        usernames: [username],
        excludeBannedUsers: true
      })
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: 'Roblox API error' }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();

    if (data.data && data.data.length > 0) {
      return new Response(
        JSON.stringify(data.data[0]),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'User not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Resolve error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
