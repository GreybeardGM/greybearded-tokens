// get-player-cam.js (ESM)
// Snapshot: Map<actorId, "#RRGGBB">
let _playerColorSnapshot = null;

/** Robust: beliebiges Foundry-/PIXI-Farbformat → "#RRGGBB" oder null */
function toCssHex(color) {
  if (color == null) return null;

  // Zahl (PIXI/Foundry-Int)
  if (typeof color === "number" && Number.isFinite(color)) {
    try { return PIXI.utils.hex2string(color); } catch { /* fallthrough */ }
  }

  if (typeof color === "string") {
    const s = color.trim();
    if (!s) return null;

    // "0xAABBCC" / "0XAABBCC"
    if (/^0x[0-9a-f]{6}$/i.test(s)) {
      const n = parseInt(s, 16);
      try { return PIXI.utils.hex2string(n); } catch { /* fallthrough */ }
    }

    // "#abc" → "#aabbcc"
    if (/^#[0-9a-f]{3}$/i.test(s)) {
      const r = s[1], g = s[2], b = s[3];
      return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
    }

    // "#aabbcc"
    if (/^#[0-9a-f]{6}$/i.test(s)) return s.toLowerCase();

    // "aabbcc" → "#aabbcc"
    if (/^[0-9a-f]{6}$/i.test(s)) return `#${s}`.toLowerCase();
  }

  return null;
}

/**
 * Baue den Snapshot neu auf:
 *  - iteriert über alle Users
 *  - nimmt deren Spielerfarbe (user.color) → normiert zu "#RRGGBB"
 *  - und die ActorID des zugewiesenen Spielercharakters (user.character?.id)
 * Resultat: Map<actorId, "#RRGGBB">
 */
function _rebuildPlayerColorSnapshot() {
  const map = new Map();
  const users = game.users?.contents ?? [];
  for (const user of users) {
    const actorId = user.character?.id ?? null;
    const css = toCssHex(user.color);
    if (!actorId || !css) continue;
    if (!map.has(actorId)) map.set(actorId, css);
  }
  _playerColorSnapshot = map;
  return _playerColorSnapshot;
}

/**
 * Gib die Spielerfarbe für eine ActorID zurück.
 * @param {string} actorId - ID des Actors (Spielercharakter)
 * @param {boolean} [rebuildSnapshot=false] - wenn true, Snapshot vorher neu bauen
 * @returns {string|null} "#RRGGBB" oder null
 */
export function getPlayerColor(actorId, rebuildSnapshot = false) {
  if (!actorId) return null;
  if (rebuildSnapshot || !_playerColorSnapshot) _rebuildPlayerColorSnapshot();
  return _playerColorSnapshot.get(actorId) ?? null;
}

/** Optional: öffentliches Rebuild */
export function rebuildPlayerColorSnapshot() {
  return _rebuildPlayerColorSnapshot();
}
