// apply-frame.js
import { getTintColor } from "./get-tint-color.js";
import { getGbFrameSettings } from "./settings-snapshot.js";

function setupFrameSprite(sprite, w, h, cx, cy, z, tint) {
  if (sprite.anchor?.set) sprite.anchor.set(0.5);
  sprite.position.set(cx, cy);
  sprite.width = w;
  sprite.height = h;

  sprite.zIndex = z;
  sprite.alpha = 1.0;
  sprite.tint = (tint ?? 0xFFFFFF) >>> 0;
  sprite.blendMode = PIXI.BLEND_MODES.NORMAL;
  sprite.mask = null;
  sprite.filters = null;
  sprite.cacheAsBitmap = false;
}

/* =========================
   Interner Namespace je Token
   ========================= */
function ensureGbNS(token) {
  if (!token._gb) token._gb = {
    overlay: null,
    f1: null,
    f2: null,
    nameplateAnchored: false,
    maskApplied: false,
    maskSprite: null,
    maskHolder: null,
    maskTarget: null
  };
  return token._gb;
}

/* =========================
   Async Guards / Timing
   ========================= */
function onceValid(tex) {
  return tex?.valid
    ? Promise.resolve()
    : new Promise((res) => tex?.once?.("update", res));
}

async function waitForMeshReady(token) {
  const mesh = token?.mesh;
  if (!mesh) return;
  // Quelle bereit?
  await onceValid(mesh.texture);
  // Einen Tick für korrekte Bounds/WorldTransform
  await new Promise((r) => requestAnimationFrame(r));
}

/* =========================
   Overlay bereitstellen
   ========================= */
function ensureOverlay(token) {
  const gb = ensureGbNS(token);
  const mesh = token?.mesh;
  if (!mesh) return null;

  // Parent ist das Container-Element, das auch das Mesh hält
  const parent = mesh.parent ?? token;
  // Wichtig: Parent sortiert nach zIndex
  parent.sortableChildren = true;

  if (gb.overlay && gb.overlay.parent === parent) return gb.overlay;

  // ggf. altes Overlay sauber entsorgen
  if (gb.overlay?.parent) {
    try { gb.overlay.destroy({ children: true }); } catch {}
  }

  const overlay = new PIXI.Container();
  overlay.name = "gb-overlay";
  overlay.sortableChildren = true;

  // Overlay als GESCHWISTER vom Mesh einhängen (nicht in mesh!)
  parent.addChild(overlay);

  // Overlay deutlich über das Mesh heben
  overlay.zIndex = (mesh.zIndex ?? 0) + 10;

  // Sicherheitsnetze
  overlay.alpha = 1.0;
  overlay.mask = null;
  overlay.filters = null;
  overlay.cacheAsBitmap = false;
  overlay.eventMode = "none"; // kein HitTest

  gb.overlay = overlay;
  return overlay;
}

/* =========================
   Masken-Cleanup (sicher)
   ========================= */
function destroyMaskIfAny(token) {
  const gb = ensureGbNS(token);
  if (gb.maskApplied && gb.maskTarget) {
    gb.maskTarget.mask = null;
  }
  gb.maskTarget = null;

  try { gb.maskSprite?.destroy?.({ children: true, texture: false, baseTexture: false }); } catch {}
  gb.maskSprite = null;

  try { gb.maskHolder?.destroy?.({ children: true }); } catch {}
  gb.maskHolder = null;

  gb.maskApplied = false;
}

/* =========================
   Maske robust anlegen
   ========================= */
async function attachMaskIfNeeded(token, S) {
  const gb = ensureGbNS(token);
  const M = S?.mask;
  if (!M?.enabled || !M?.path) {
    if (gb.maskApplied) destroyMaskIfAny(token);
    return;
  }
  if (gb.maskApplied) return;

  const mesh = token?.mesh;
  if (!mesh) return;

  // Quelle stabilisieren
  await waitForMeshReady(token);

  // Masken-Textur laden
  const tex = PIXI.Texture.from(M.path);
  if (!tex.valid) await onceValid(tex);

  // Masken-Sprite vorbereiten (sichtbar/renderbar lassen!)
  const maskSprite = new PIXI.Sprite(tex);
  maskSprite.name = "gb-mask-sprite";
  // Wichtig: NICHT visible=false / renderable=false setzen
  // NICHT alpha=0 setzen, NICHT in unsichtbaren Holder packen

  // In denselben Parent wie das Mesh hängen
  const parent = mesh.parent ?? token;
  parent.addChild(maskSprite);

  // Auf Token-Bounds zentrieren
  const w = mesh.width, h = mesh.height;
  if (maskSprite.anchor?.set) maskSprite.anchor.set(0.5);
  maskSprite.position.set(mesh.x ?? 0, mesh.y ?? 0);
  maskSprite.width  = w;
  maskSprite.height = h;

  // WICHTIG: KEIN await/rAF hier dazwischen!
  // Direkt im selben Tick die Maske aktivieren,
  // so hat die Sprite keine Chance, einmal "als Inhalt" zu zeichnen.
  mesh.mask = maskSprite;

  gb.maskSprite = maskSprite;
  gb.maskTarget = mesh;
  gb.maskApplied = true;
}

/* =========================
   Frames anwenden
   ========================= */
export async function applyFrameToToken(token) {
  const S = getGbFrameSettings?.() ?? {};
  const F1 = S?.frame1;
  const F2 = S?.frame2;

  const mesh = token?.mesh;
  if (!mesh) return;

  // Quelle stabilisieren
  await waitForMeshReady(token);

  const overlay = ensureOverlay(token);
  if (!overlay) return;

  const gb = ensureGbNS(token);

  // Primärer Frame
  let frame1 = gb.f1;
  if (!frame1 && F1?.enabled && F1?.path) {
    frame1 = new PIXI.Sprite(PIXI.Texture.from(F1.path));
    if (!frame1.texture.valid) await onceValid(frame1.texture);
    frame1.name = "gb-frame-1";
    overlay.addChild(frame1);
    gb.f1 = frame1;
  }
  // Sekundärer Frame
  let frame2 = gb.f2;
  if (!frame2 && F2?.enabled && F2?.path) {
    frame2 = new PIXI.Sprite(PIXI.Texture.from(F2.path));
    if (!frame2.texture.valid) await onceValid(frame2.texture);
    frame2.name = "gb-frame-2";
    overlay.addChild(frame2);
    gb.f2 = frame2;
  }

  // Nicht benötigte Frames aufräumen
  if (frame1 && !(F1?.enabled && F1?.path)) {
    try { frame1.destroy({ children: true, texture: false, baseTexture: false }); } catch (_e) {}
    gb.f1 = frame1 = null;
  }
  if (frame2 && !(F2?.enabled && F2?.path)) {
    try { frame2.destroy({ children: true, texture: false, baseTexture: false }); } catch (_e) {}
    gb.f2 = frame2 = null;
  }

  // Disposition-/Custom-Tint
  const tint1 = F1?.tint ?? getTintColor?.(token, "primary");
  const tint2 = F2?.tint ?? getTintColor?.(token, "secondary");

   // Frames positionieren (zentriert) und skalieren
   const w = mesh.width;
   const h = mesh.height;
   const cx = mesh.x ?? 0;
   const cy = mesh.y ?? 0;
   
   // sekundär zuerst, dann primär, damit primär "oben" liegt
   if (frame2) {
      const scale2 = F2?.scale ?? 1;
      setupFrameSprite(frame2, w*scale2, h*scale2, cx, cy, 1, (F2?.tint));
      overlay.addChild(frame2); // sicherstellen, dass Parent Overlay ist
   }
   
   if (frame1) {
      const scale1 = F1?.scale ?? 1;
      setupFrameSprite(frame1, w*scale1, h*scale1, cx, cy, 2, (F1?.tint));
      overlay.addChild(frame1);
   }

   overlay.sortDirty = true;

  // Maske zuletzt und einmalig anlegen
  await attachMaskIfNeeded(token, S);

  console.debug("GB overlay check", {
    parentSortable: (overlay.parent?.sortableChildren ?? false),
    meshZ: mesh.zIndex, overlayZ: overlay.zIndex,
    overlayAlpha: overlay.alpha,
    overlayMasked: !!overlay.mask,
    overlayFilters: overlay.filters?.length ?? 0,
    f1ParentIsOverlay: gb.f1?.parent === overlay,
    f2ParentIsOverlay: gb.f2?.parent === overlay
  });

}

/* =========================
   Extern nutzbar: Maske neu aufbauen
   ========================= */
export async function rebuildMask(token) {
  destroyMaskIfAny(token);
  const S = getGbFrameSettings?.() ?? {};
  await attachMaskIfNeeded(token, S);
}

/* =========================
   Extern nutzbar: Alles bereinigen
   ========================= */
export function teardownFrames(token) {
  const gb = ensureGbNS(token);

  destroyMaskIfAny(token);

  for (const spr of [gb.f1, gb.f2]) {
    try { spr?.destroy?.({ children: true, texture: false, baseTexture: false }); } catch (_e) {}
  }
  gb.f1 = gb.f2 = null;

  if (gb.overlay) {
    try { gb.overlay.destroy({ children: true }); } catch (_e) {}
  }
  gb.overlay = null;
}
