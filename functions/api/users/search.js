// GET /api/users/search?keyword=...
// Search Roblox users by keyword (for autocomplete)

export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const keyword = url.searchParams.get('keyword');

    if (!keyword || keyword.length < 2) {
      return new Response(
        JSON.stringify({ data: [] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Call Roblox Search API
    const response = await fetch(
      `https://users.roblox.com/v1/users/search?keyword=${encodeURIComponent(keyword)}&limit=5`,
      {
        headers: {
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      // Search API may have restrictions, return empty array
      return new Response(
        JSON.stringify({ data: [] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();

    return new Response(
      JSON.stringify(data),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Search error:', error);
    return new Response(
      JSON.stringify({ data: [] }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
