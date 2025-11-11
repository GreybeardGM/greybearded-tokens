// settings/snapshot.js
import { MOD_ID, DEFAULT_COLORS, DEFAULT_NAMEPLATES, DEFAULT_FRAME1, DEFAULT_FRAME2, DEFAULT_MASK } from "../constants.js";

let _S = null;

function num(v, fb = 1)   { const n = Number(v); return Number.isFinite(n) ? n : fb; }
function bool(v)          { return !!v; }
function str(v, fb = "")  { return (typeof v === "string" && v.length) ? v : fb; }

function _readAll() {
  const get = (k) => game.settings.get(MOD_ID, k);

  // Neues gruppiertes Frames-Setting
  const FR = (() => {
    try {
      const v = get("frames");
      return (v && typeof v === "object") ? v : null;
    } catch { return null; }
  })();
  
  const snap = {
    // ── Frames ──────────────────────────────────────────────────────────────
    frame1: {
      path:           str(FR?.frame1?.path,           DEFAULT_FRAME1.path),
      scale:          num(FR?.frame1?.scale,          DEFAULT_FRAME1.scale),
      tintMode:       str(FR?.frame1?.tintMode,       DEFAULT_FRAME1.tintMode),
      usePlayerColor: bool(FR?.frame1?.usePlayerColor),
      defaultColor:   str(FR?.frame1?.defaultColor,   DEFAULT_FRAME1.defaultColor)
    },
    frame2: {
      enabled:        bool(FR?.frame2?.enabled),
      path:           str(FR?.frame2?.path,           DEFAULT_FRAME2.path),
      scale:          num(FR?.frame2?.scale,          DEFAULT_FRAME2.scale),
      tintMode:       str(FR?.frame2?.tintMode,       DEFAULT_FRAME2.tintMode),
      usePlayerColor: bool(FR?.frame2?.usePlayerColor),
      defaultColor:   str(FR?.frame2?.defaultColor,   DEFAULT_FRAME2.defaultColor)
    },
    mask: {
      enabled:        bool(FR?.mask?.enabled),
      path:           str(FR?.mask?.path,             DEFAULT_MASK.path)
    },

    // ── Nameplates ───────────────────────────────────────────────────────────
    nameplate: (() => {
      try {
        const v = game.settings.get(MOD_ID, "nameplate");
        return (v && typeof v === "object") ? v : DEFAULT_NAMEPLATES;
      } catch { 
        return DEFAULT_NAMEPLATES;
      }
    })(),
    
    // ── Colors (gruppiert) ──────────────────────────────────────────────────
    colors: (() => {
      try {
        const v = game.settings.get(MOD_ID, "colors");
        return (v && typeof v === "object") ? v : DEFAULT_COLORS;
      } catch {
        return DEFAULT_COLORS;
      }
    })()
  
  };

  return snap;
}

/**
 * Liefert den aktuellen Snapshot.
 * Vor `ready`: Live-Fallback ohne Memo (kein verfrühtes Cachen).
 * Ab `ready` (nach buildSnapshot): memoized Rückgabe.
 */
export function getGbFrameSettings() {
  if (_S) return _S;
  if (game?.ready) {
    _S = _readAll();
    return _S;
  }
  return _readAll();
}

/** Erzwingt Neuaufbau und Memoisierung. */
export function buildSnapshot() {
  _S = _readAll();
  return _S;
}

/** Optionales manuelles Invalidieren (Tests/Reloads) */
export function invalidateGbFrameSettings() {
  _S = null;
}
