// settings-snapshot.js
import { MOD_ID, DEFAULT_COLORS } from "./constants.js";

let _S = null;

function num(v, fb = 1)   { const n = Number(v); return Number.isFinite(n) ? n : fb; }
function bool(v)          { return !!v; }
function str(v, fb = "")  { return (typeof v === "string" && v.length) ? v : fb; }

function _readAll() {
  const get = (k) => game.settings.get(MOD_ID, k);

  const snap = {
    // ── Frame 1 ──────────────────────────────────────────────────────────────
    frame1: {
      path:           str(get("path1"), "modules/greybearded-tokens/assets/frame-default.png"),
      scale:          num(get("scale1"), 1),
      tintMode:       str(get("tintMode1"), "Disposition"),
      usePlayerColor: bool(get("usePlayerColor1")),
      // Neuer, dedizierter Default; fällt auf Legacy-Global zurück
      defaultColor:   str(get("frame1DefaultColor"), "#888888" )
    },

    // ── Frame 2 ──────────────────────────────────────────────────────────────
    frame2: {
      enabled:        bool(get("secondEnabled")),
      path:           str(get("path2"), "modules/greybearded-tokens/assets/frame-secondary.png"),
      scale:          num(get("scale2"), 1),
      tintMode:       str(get("tintMode2"), "Unicolor"),
      usePlayerColor: bool(get("usePlayerColor2")),
      // Neuer, dedizierter Default; fällt auf Legacy-Global zurück
      defaultColor:   str(get("frame2DefaultColor"), "#888888" )
    },

    // ── Mask ─────────────────────────────────────────────────────────────────
    mask: {
      enabled:  bool(get("maskEnabled")),
      path:     str(get("pathMask"), "modules/greybearded-tokens/assets/mask-round.png")
    },

    // ── Nameplates ───────────────────────────────────────────────────────────
    nameplate: {
      enabled:        bool(get("nameplateEnabled")),
      baseFontSize:   num(get("nameplateBaseFontSize"), 22),
      fontFamily:     str(get("nameplateFontFamily"), "Signika"),
      usePlayerColor: bool(get("nameplateUsePlayerColor")),
      defaultColor:   str(get("nameplateDefaultColor"), "#888888" ),
      tintMode:       str(get("nameplateTintMode"), "Unicolor"),
      scaleWithToken: bool(get("nameplateScaleWithToken"))
    },

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
