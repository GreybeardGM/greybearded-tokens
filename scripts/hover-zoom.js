// hover-zoom.js (robust, multipliziert auf die Foundry-Basisskala)

// Konfig
const HOVER_SCALE = 1.06;
const HOVER_MS    = 150;
const EASING      = t => 1 - Math.pow(1 - t, 3); // easeOutCubic

// --- Basisskala cachen & Utilities -----------------------------------------
function ensureBaseScale(token) {
  if (!token || token.destroyed) return;
  const s = token?.mesh?.scale;
  if (!s) return;
  if (token._gbBaseScale == null) token._gbBaseScale = { x: s.x, y: s.y };
  // Overlay anlegen/ausrichten (Sibling des Meshes)
  if (!token._gbOverlay) {
    const overlay = new PIXI.Container();
    overlay.name = "gb-overlay";
    token.addChild(overlay);
    token._gbOverlay = overlay;
  }
  // Overlay so positionieren/rotieren wie das Mesh
  token._gbOverlay.position.set(token.w / 2, token.h / 2);
  token._gbOverlay.rotation = token.mesh.rotation;
  // WICHTIG: Overlay immer an Mesh-Skala koppeln (kein eigener Basiswert!)
  token._gbOverlay.scale.copyFrom(token.mesh.scale);
}

// Sichtbarer Zoomfaktor (1.0 = Basis)
function getVisualScale(token) {
  return token?._gbVisualScale ?? 1.0;
}

// Setzt nur den *Faktor*; die echte Mesh-Skala wird: base * faktor
function applyVisualScale(token, factor) {
  if (!token || token.destroyed) return;
  ensureBaseScale(token);
  const base = token._gbBaseScale;
  if (!base) return;

  token._gbVisualScale = factor;

  // Mesh bekommt Basis * Faktor
  token.mesh.scale.set(base.x * factor, base.y * factor);

  // Overlay direkt an die (neue) Mesh-Skala koppeln (keine eigene Basis halten!)
  if (token._gbOverlay?.scale) {
    token._gbOverlay.scale.copyFrom(token.mesh.scale);
  }
}

function cancelHoverTween(token) {
  const t = token?._gbHoverTween;
  if (!t) return;
  if (t.raf) cancelAnimationFrame(t.raf);
  token._gbHoverTween = null;
}

// Tween von aktuellem Faktor -> Ziel-Faktor (nicht absolute Meshwerte!)
function tweenFactor(token, targetFactor, ms = HOVER_MS) {
  cancelHoverTween(token);
  if (!token || token.destroyed) return;

  ensureBaseScale(token);
  const start = getVisualScale(token);
  const delta = targetFactor - start;
  if (Math.abs(delta) < 0.001) return;

  const state = { startTS: performance.now(), dur: ms, raf: null };
  token._gbHoverTween = state;

  const step = (now) => {
    if (!token || token.destroyed) return cancelHoverTween(token);
    const t = Math.min(1, (now - state.startTS) / state.dur);
    const eased = EASING(t);
    applyVisualScale(token, start + delta * eased);
    if (t < 1) state.raf = requestAnimationFrame(step);
    else cancelHoverTween(token);
  };
  state.raf = requestAnimationFrame(step);
}

// --- Hooks -------------------------------------------------------------------
Hooks.on("hoverToken", (token, hovered) => {
  if (!token || token.destroyed) return;
  if (token._dragging) return; // beim Drag nicht zoomen
  tweenFactor(token, hovered ? HOVER_SCALE : 1.0, HOVER_MS);
});

Hooks.on("controlToken", (token, controlled) => {
  // Bei Control-Wechsel: Tween aborten & sauber auf Faktor 1 zurück
  cancelHoverTween(token);
  applyVisualScale(token, 1.0);
});

Hooks.on("deleteToken", () => {
  // nichts nötig, defensiv könnten wir hier Flags löschen
});

Hooks.on("canvasReady", () => {
  // Basisskalen erfassen & auf *Faktor* 1.0 zurück (nicht Mesh hart auf 1!)
  for (const t of canvas.tokens.placeables) {
    cancelHoverTween(t);
    ensureBaseScale(t);
    applyVisualScale(t, 1.0);
  }
});

// Beim Drag neutral halten (verhindert klebrige Restfaktoren)
Hooks.on("updateToken", (doc, changes) => {
  const t = canvas.tokens.get(doc.id);
  if (!t || t.destroyed) return;
  if (changes.x !== undefined || changes.y !== undefined) {
    cancelHoverTween(t);
    applyVisualScale(t, 1.0);
  }
});
