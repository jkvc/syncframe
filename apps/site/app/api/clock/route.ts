export const dynamic = 'force-dynamic';

// Authoritative server time for @syncframe/core's NTP-style clock sync.
// Clients probe this repeatedly to estimate their offset from server time,
// so every browser evaluates anchors against the same shared clock.
export function GET() {
  return Response.json({ serverNowMs: Date.now() });
}
