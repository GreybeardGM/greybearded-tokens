// settings-snapshot.js
import { MOD_ID, DEFAULT_COLORS } from "./constants.js";

let _S = null;
let _VER = 0;

function num(v, fb = 1)   { const n = Number(v); return Number.isFinite(n) ? n : fb; }
function bool(v)          { return !!v; }
function str(v, fb = "")  { return (typeof v === "string" && v.length) ? v : fb; }

function _readAll() {
  const get = (k) => game.settings.get(MOD_ID, k);

  const snap = {
    // ── Frame 1 (NEU: gruppiert) ─────────────────────────────────────────────
    frame1: {
      path:           str(get("path1"), "modules/greybearded-tokens/assets/frame-default.png"),
      scale:          num(get("scale1"), 1),
      tintMode:       str(get("tintMode1"), "Disposition"),
      usePlayerColor: bool(get("usePlayerColor1"))
    },

    // ── Frame 2 (NEU: gruppiert) ─────────────────────────────────────────────
    frame2: {
      enabled:        bool(get("secondEnabled")),
      path:           str(get("path2"), "modules/greybearded-tokens/assets/frame-secondary.png"),
      scale:          num(get("scale2"), 1),
      tintMode:       str(get("tintMode2"), "Unicolor"),
      usePlayerColor: bool(get("usePlayerColor2"))
    },

    // ── Mask (NEU: gruppiert) ────────────────────────────────────────────────
    mask: {
      enabled:  bool(get("maskEnabled")),
      path:     str(get("pathMask"), "modules/greybearded-tokens/assets/mask-round.png")
    },

    // ── Farben (Fallbacks aus DEFAULT_COLORS) ────────────────────────────────
    colors: {
      default:   str(get("color-default"),       DEFAULT_COLORS.default),
      hostile:   str(get("color-hostile"),       DEFAULT_COLORS.hostile),
      neutral:   str(get("color-neutral"),       DEFAULT_COLORS.neutral),
      friendly:  str(get("color-friendly"),      DEFAULT_COLORS.friendly),
      secret:    str(get("color-secret"),        DEFAULT_COLORS.secret),
      character: str(get("color-character"),     DEFAULT_COLORS.character)
    },

    // ── Nameplates (bereits gruppiert) ───────────────────────────────────────
    nameplate: {
      enabled:        bool(get("nameplateEnabled")),
      baseFontSize:   num(get("nameplateBaseFontSize"), 22),     // px
      fontFamily:     str(get("nameplateFontFamily"), "Signika"),
      defaultColor:   str(get("nameplateDefaultColor"), "#ffffff"),
      tintMode:       str(get("nameplateTintMode"), "Unicolor"),
      scaleWithToken: bool(get("nameplateScaleWithToken"))
    },

    // ── Meta ─────────────────────────────────────────────────────────────────
    version: _VER,
    snapshotAt: Date.now()
  };

/**
 * Liefert den aktuellen Snapshot.
 * Vor `ready`: Live-Fallback ohne Memo (kein verfrühtes Cachen).
 * Ab `ready` (nach buildSnapshot): memoized Rückgabe.
 */
export function getGbFrameSettings() {
  if (_S) return _S;
  if (game?.ready) {
    _S = _readAll();
    _S.version = ++_VER;
    _S.snapshotAt = Date.now();
    return _S;
  }
  return _readAll();
}

/** Erzwingt Neuaufbau und Memoisierung. */
export function buildSnapshot() {
  _S = _readAll();
  _S.version = ++_VER;
  _S.snapshotAt = Date.now();
  return _S;
}

/** Optionales manuelles Invalidieren (Tests/Reloads) */
export function invalidateGbFrameSettings() {
  _S = null;
}
