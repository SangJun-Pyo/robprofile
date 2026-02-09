// GET /api/debug/refresh-status
// Returns the most recent refresh-games status from KV
// Falls back to reconstructing status from game pool metadata if status key is missing

import { CACHE_KEY as POOL_KEY, STATUS_KEY } from '../../lib/constants.js';

export async function onRequestGet(context) {
  const { env } = context;

  // Check if KV is bound
  if (!env.ROBPROFILE_CACHE) {
    return json({ error: 'KV not configured', help: 'Add ROBPROFILE_CACHE KV binding in Cloudflare Pages settings' }, 500);
  }

  try {
    const status = await env.ROBPROFILE_CACHE.get(STATUS_KEY, 'json');

    if (status) {
      return json(status);
    }

    // Fallback: reconstruct status from game pool metadata
    const pool = await env.ROBPROFILE_CACHE.get(POOL_KEY, 'json');

    if (pool) {
      return json({
        success: true,
        updatedAt: pool.updatedAt || null,
        count: pool.count || pool.items?.length || 0,
        source: {
          api: pool.source || 'unknown',
          universeIdsFetched: pool.fetchedUniverseIdsCount || null,
          enriched: pool.enrichedGamesCount || null,
          filtered: pool.filteredGamesCount || pool.count || null
        },
        _fallback: true
      });
    }

    return json({ message: 'No refresh status or game pool found', hint: 'Call /api/admin/refresh-games first' }, 404);

  } catch (err) {
    return json({ error: 'Failed to read status', details: err.message }, 500);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}
