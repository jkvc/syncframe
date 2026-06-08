/**
 * Deterministic color from a screen name — for map/grid UI in consumers.
 * Pure string hash → HSL; no DOM.
 */

export function colorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  const hue = hash % 360;
  return `hsl(${hue} 65% 55%)`;
}
