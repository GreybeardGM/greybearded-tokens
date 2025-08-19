// get-player-color.js
import { dbg, warn } from "./debug.js";

// Snapshot: Map<actorId, "#RRGGBB">
let _playerColorSnapshot = null;

function toCssHex(color) {
  if (color == null) return null;
  if (typeof color === "number" && Number.isFinite(color)) {
    try { return PIXI.utils.hex2string(color); } catch { /*noop*/ }
  }
  if (typeof color === "string") {
    const s = color.trim();
    if (!s) return null;
    if (/^0x[0-9a-f]{6}$/i.test(s)) {
      const n = parseInt(s, 16);
      try { return PIXI.utils.hex2string(n); } catch { /*noop*/ }
    }
    if (/^#[0-9a-f]{6}$/i.test(s)) return s.toLowerCase();
    if (/^[0-9a-f]{6}$/i.test(s)) return `#${s}`.toLowerCase();
    if (/^#[0-9a-f]{3}$/i.test(s)) {
      const r=s[1], g=s[2], b=s[3];
      return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
    }
  }
  return null;
}

function _rebuildPlayerColorSnapshot() {
  const map = new Map();
  const users = game.users?.contents ?? [];
  dbg("Snapshot rebuild start. Users:", users.length);

  for (const user of users) {
    const actorId = user.character?.id ?? null;
    const raw = user.color;
    const css = toCssHex(raw);
    dbg(" user:", user.name, { actorId, rawColor: raw, css });

    if (!actorId) continue;
    if (!css) {
      warn("Kein gültiger Farbwert konvertierbar für User:", user.name, raw);
      continue;
    }
    if (!map.has(actorId)) map.set(actorId, css);
  }

  dbg("Snapshot rebuild done. Entries:", map.size, Array.from(map.entries()));
  _playerColorSnapshot = map;
  return _playerColorSnapshot;
}

export function getPlayerColor(actorId, rebuildSnapshot = false) {
  if (!actorId) {
    warn("getPlayerColor ohne actorId aufgerufen");
    return null;
  }
  if (rebuildSnapshot || !_playerColorSnapshot) {
    dbg("getPlayerColor → rebuildSnapshot:", rebuildSnapshot, " snapshot null?", !_playerColorSnapshot);
    _rebuildPlayerColorSnapshot();
  }
  const color = _playerColorSnapshot.get(actorId) ?? null;
  dbg("getPlayerColor lookup", { actorId, hit: !!color, color });
  return color;
}

export function rebuildPlayerColorSnapshot() {
  return _rebuildPlayerColorSnapshot();
}

// Optional: schnelle Debug-Hilfen
globalThis.GBTF = globalThis.GBTF || {};
globalThis.GBTF.dumpPlayerColorSnapshot = () => {
  const map = _playerColorSnapshot ?? _rebuildPlayerColorSnapshot();
  console.group("🟣[GBT] PlayerColor Snapshot Dump");
  for (const [actorId, css] of map.entries()) console.log({ actorId, css });
  console.groupEnd();
  return map;
};
