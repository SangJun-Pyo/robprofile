// GET /api/debug/refresh-status
// Returns the most recent refresh-games result from KV

const STATUS_KEY = 'refresh_status_v1';

export async function onRequestGet(context) {
  const { env } = context;

  // Check if KV is bound
  if (!env.ROBPROFILE_CACHE) {
    return new Response(JSON.stringify({
      error: 'KV not configured',
      help: 'Add ROBPROFILE_CACHE KV binding in Cloudflare Pages settings'
    }, null, 2), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const status = await env.ROBPROFILE_CACHE.get(STATUS_KEY, 'json');

    if (!status) {
      return new Response(JSON.stringify({
        message: 'No refresh status found',
        hint: 'Call /api/admin/refresh-games first to populate the game pool'
      }, null, 2), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(status, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({
      error: 'Failed to read status',
      details: err.message
    }, null, 2), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
