// get-player-color.js

// Snapshot: Map<actorId, "#RRGGBB">
let _playerColorSnapshot = null;

function toCssHex(color) {
  if (color == null) return null;

  // 1) Versuche IMMER, zu einer primitiven Zahl zu casten (handlet Number-Objekte & "0x..." Strings)
  const n = Number(color);
  if (Number.isFinite(n)) {
    try {
      return PIXI.utils.hex2string(n); // -> "#rrggbb"
    } catch {
      /* fallthrough to string handling */
    }
  }

  // 2) String-Fälle (zur Sicherheit)
  if (typeof color === "string") {
    const s = color.trim();
    // "#aabbcc"
    if (/^#[0-9a-f]{6}$/i.test(s)) return s.toLowerCase();
    // "aabbcc" → "#aabbcc"
    if (/^[0-9a-f]{6}$/i.test(s)) return `#${s}`.toLowerCase();
    // "#abc" → "#aabbcc"
    if (/^#[0-9a-f]{3}$/i.test(s)) {
      const r = s[1], g = s[2], b = s[3];
      return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
    }
  }

  return null;
}

function _rebuildPlayerColorSnapshot() {
  const map = new Map();
  const users = game.users?.contents ?? [];

  for (const user of users) {
    const actorId = user.character?.id ?? null;
    const raw = user.color;
    const css = toCssHex(raw);

    if (!actorId) continue;
    if (!css) {
      continue;
    }
    if (!map.has(actorId)) map.set(actorId, css);
  }

  _playerColorSnapshot = map;
  return _playerColorSnapshot;
}

export function getPlayerColor(actorId) {
  if (!actorId) {
    return null;
  }
  if (!_playerColorSnapshot) {
    _rebuildPlayerColorSnapshot();
  }
  const color = _playerColorSnapshot.get(actorId) ?? null;
  return color;
}

export function rebuildPlayerColorSnapshot() {
  return _rebuildPlayerColorSnapshot();
}
