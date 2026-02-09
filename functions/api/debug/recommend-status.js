// GET /api/debug/recommend-status
// Returns diagnostic info for the recommend pipeline.
// Safe: never exposes raw values — only lengths and booleans.

import { CACHE_KEY } from '../../lib/constants.js';

export async function onRequestGet(context) {
  const { request, env } = context;

  const diag = {
    timestamp: new Date().toISOString(),

    // (a) KV binding 존재 여부
    kvBindingExists: !!env.ROBPROFILE_CACHE,

    // (b) 읽는 KV key 이름
    kvKey: CACHE_KEY,

    // (c) KV get 결과 raw string 길이
    kvRawLength: null,

    // (d) JSON.parse 성공/실패 + 에러 메시지
    jsonParseOk: null,
    jsonParseError: null,

    // (e) pool 배열 길이
    poolItemsLength: null,
    poolUpdatedAt: null,

    // (f) 실행 환경
    env: {
      CF_PAGES_BRANCH: env.CF_PAGES_BRANCH || null,
      CF_PAGES_URL: env.CF_PAGES_URL || null,
      colo: request.cf?.colo || null,
    }
  };

  if (!env.ROBPROFILE_CACHE) {
    return json(diag);
  }

  try {
    // (c) raw string length
    const raw = await env.ROBPROFILE_CACHE.get(CACHE_KEY, 'text');
    diag.kvRawLength = raw ? raw.length : 0;

    // (d) JSON.parse
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        diag.jsonParseOk = true;

        // (e) pool items length
        diag.poolItemsLength = Array.isArray(parsed.items) ? parsed.items.length : null;
        diag.poolUpdatedAt = parsed.updatedAt || null;
      } catch (parseErr) {
        diag.jsonParseOk = false;
        diag.jsonParseError = parseErr.message;
      }
    } else {
      diag.jsonParseOk = null; // nothing to parse
    }
  } catch (kvErr) {
    diag.kvReadError = kvErr.message;
  }

  return json(diag);
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}
