#!/usr/bin/env node
/* eslint-env node */
/**
 * Smoke test spatial API against a running dev server.
 * Usage: node scripts/test-spatial-api.mjs [baseUrl]
 * Default baseUrl: http://localhost:3000
 */

const BASE = process.argv[2] ?? 'http://localhost:3000';
const API = `${BASE}/api/spatial`;

async function json(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: res.status, data };
}

async function main() {
  const screenName = `test-${Date.now().toString(36)}`;
  console.log('Register screen', screenName);
  let r = await json('POST', '/screens/register', { name: screenName });
  if (r.status !== 200) throw new Error(`register failed: ${JSON.stringify(r)}`);

  r = await json('POST', '/heartbeat', {
    screenName,
    sessionId: 'smoke-session',
    clientWidthPx: 1920,
    clientHeightPx: 1080,
    devicePixelRatio: 1,
    userAgent: 'test-spatial-api',
  });
  if (r.status !== 200) throw new Error(`heartbeat failed: ${JSON.stringify(r)}`);

  r = await json('POST', '/render-mode', { mode: 'content' });
  if (r.status !== 200) throw new Error(`render-mode failed: ${JSON.stringify(r)}`);

  r = await json('POST', '/dot', { action: 'start' });
  if (r.status !== 200) throw new Error(`dot start failed: ${JSON.stringify(r)}`);

  const streamRes = await fetch(`${API}/stream`);
  if (!streamRes.ok) throw new Error(`stream failed: ${streamRes.status}`);
  const reader = streamRes.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  let snapshot = null;
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const idx = buf.indexOf('data: ');
    if (idx >= 0) {
      const line = buf.slice(idx + 6).split('\n')[0];
      snapshot = JSON.parse(line);
      break;
    }
  }
  reader.cancel();
  if (!snapshot?.meta?.spatial?.screens?.[screenName]) {
    throw new Error('stream snapshot missing spatial screen');
  }
  if (!snapshot.anchors?.dot) {
    throw new Error('stream snapshot missing dot anchor');
  }

  r = await json('DELETE', `/screens/delete?name=${encodeURIComponent(screenName)}`);
  if (r.status !== 200) throw new Error(`delete failed: ${JSON.stringify(r)}`);

  console.log('OK — spatial API smoke test passed');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
