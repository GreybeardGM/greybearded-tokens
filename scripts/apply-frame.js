// apply-frame.js
import { getTintColor } from "./get-tint-color.js";
import { getGbFrameSettings } from "./settings-snapshot.js";

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
  if (gb.overlay && gb.overlay.parent) return gb.overlay;

  const mesh = token.mesh;
  if (!mesh) return null;

  const overlay = new PIXI.Container();
  overlay.name = "gb-overlay";
  overlay.sortableChildren = true;

  // Unter dem Token-Mesh anhängen, aber ÜBER dem Artwork zeichnen
  // In Foundry VTT V13 hängt das Mesh selbst bereits im Token Container:
  (mesh.parent ?? token).addChild(overlay);

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

  if (gb.maskSprite) {
    try { gb.maskSprite.destroy({ children: true, texture: false, baseTexture: false }); } catch (_e) {}
  }
  gb.maskSprite = null;

  if (gb.maskHolder) {
    try { gb.maskHolder.destroy({ children: true }); } catch (_e) {}
  }
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
    // Falls Setting abgeschaltet wurde: säubern
    if (gb.maskApplied) destroyMaskIfAny(token);
    return;
  }
  if (gb.maskApplied) return; // bereits gesetzt

  const mesh = token?.mesh;
  if (!mesh) return;

  // Quelle stabil
  await waitForMeshReady(token);

  // Masken-Textur laden u. warten bis valid
  const maskSprite = new PIXI.Sprite(PIXI.Texture.from(M.path));
  if (!maskSprite.texture.valid) await onceValid(maskSprite.texture);

  // Harte Unsichtbarkeit: niemals in einen Draw-Batch geraten
  maskSprite.visible = false;
  maskSprite.renderable = false;
  maskSprite.alpha = 0.0;
  // Markiere als Maske (hilft einigen Pixi 7 Pfaden)
  maskSprite.isMask = true;

  // Nicht rendernder Holder verhindert jegliches "Zwischenframe-Zeichnen"
  const holder = new PIXI.Container();
  holder.name = "gb-mask-holder";
  holder.visible = false;
  holder.renderable = false;

  // Holder & Sprite an selbe Transform-Hierarchie wie das Mesh hängen
  const parent = mesh.parent ?? token;
  parent.addChild(holder);
  holder.addChild(maskSprite);

  // Auf Token-Bounds skalieren (lokales Koordinatensystem des Mesh annehmen)
  // Annahme: Token-Mesh ist zentriert (Foundry default)
  const w = mesh.width;
  const h = mesh.height;

  maskSprite.anchor?.set?.(0.5);
  maskSprite.position.set(mesh.x ?? 0, mesh.y ?? 0);
  maskSprite.width = w;
  maskSprite.height = h;

  // Einen Tick atmen lassen, damit Bounds/WorldTransform sicher stehen
  await new Promise((r) => requestAnimationFrame(r));

  // Jetzt Maske aktivieren – Sprite bleibt unsichtbar im Holder
  mesh.mask = maskSprite;

  gb.maskSprite = maskSprite;
  gb.maskHolder = holder;
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

  // Maße des Token-Mesh als Referenz
  const w = mesh.width;
  const h = mesh.height;

  // Disposition-/Custom-Tint
  const tint1 = F1?.tint ?? getTintColor?.(token, "primary");
  const tint2 = F2?.tint ?? getTintColor?.(token, "secondary");

  // Frames positionieren (zentriert) und skalieren
  if (frame2) {
    frame2.anchor?.set?.(0.5);
    frame2.position.set(mesh.x ?? 0, mesh.y ?? 0);
    frame2.width  = w * (F2.scale ?? 1);
    frame2.height = h * (F2.scale ?? 1);
    frame2.tint = tint2 ?? 0xFFFFFF;
    frame2.zIndex = 0;
  }

  if (frame1) {
    frame1.anchor?.set?.(0.5);
    frame1.position.set(mesh.x ?? 0, mesh.y ?? 0);
    frame1.width  = w * (F1.scale ?? 1);
    frame1.height = h * (F1.scale ?? 1);
    frame1.tint = tint1 ?? 0xFFFFFF;
    frame1.zIndex = 1;
  }

  overlay.sortDirty = true;

  // Maske zuletzt und einmalig anlegen
  await attachMaskIfNeeded(token, S);
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
