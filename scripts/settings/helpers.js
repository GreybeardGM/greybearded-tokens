// modules/greybearded-tokens/scripts/utils/helpers.js

/** Strikte HEX-Validierung (#RRGGBB oder #RRGGBBAA) */
export const HEX_RE = /^#([0-9a-f]{6}|[0-9a-f]{8})$/i;
export const isHex  = (v) => (typeof v === "string") && HEX_RE.test(v);

export function str(v, fb = "") {
  return (typeof v === "string" && v.length) ? v : fb;
}

/** Validiert String gegen Choice-Map (z. B. TINT_CHOICES, FONT_CHOICES). */
export function oneOf(v, choices, fb) {
  return (typeof v === "string" && v in choices) ? v : fb;
}

/** Flaches Objekt mit Defaults auffüllen (shallow). */
export function withDefaults(obj, defaults) {
  return Object.assign({}, defaults, (obj && typeof obj === "object") ? obj : {});
}

/** Setting als Objekt lesen, mit Defaults vereinigen. */
export function readObjectSetting(modId, key, defaults) {
  try {
    const v = game.settings.get(modId, key);
    return withDefaults(v, defaults);
  } catch {
    return structuredClone(defaults);
  }
}

/** Text- und Color-Input synchronisieren (HEX gewinnt). */
export function bindHexSync(textEl, colorEl) {
  if (!textEl || !colorEl) return;
  textEl.addEventListener("input", () => { if (isHex(textEl.value)) colorEl.value = textEl.value; });
  colorEl.addEventListener("input", () => { if (isHex(colorEl.value)) textEl.value = colorEl.value; });
}

/** Mehrere Paare nach Namenskonvention "<name>-text" / "<name>-color" binden. */
export function bindHexPairs(root, names) {
  for (const n of names) {
    const t = root.querySelector(`input[name="${n}-text"]`);
    const c = root.querySelector(`input[name="${n}-color"]`);
    bindHexSync(t, c);
  }
}

export function debugTokenToolsFlow(message, data) {
  if (data === undefined) {
    console.debug(`[greybearded-tokens] ${message}`);
    return;
  }

  console.debug(`[greybearded-tokens] ${message}`, data);
}

function setToolVisible(tool, visible) {
  if (!tool || typeof tool !== "object") return;
  tool.visible = visible;
}

/**
 * Aktualisiert ausschließlich die Sichtbarkeit bestehender Token-Tools.
 * Es werden keine Controls hinzugefügt/entfernt, um Instabilitäten zu vermeiden.
 */
export async function refreshTokenToolVisibility(config) {
  if (!ui?.controls || !canvas?.ready) return;

  const isGM = !!game.user?.isGM;
  const visibility = {
    gbShrink: isGM && !!config?.size,
    gbGrow: isGM && !!config?.size,
    gbToggleFrame: isGM && !!config?.toggleFrame,
    gbSetDisposition: isGM && !!config?.disposition
  };

  const controlsApp = ui.controls;
  const controls = controlsApp.controls;
  const tokenControl = controls?.tokens ?? controls?.token
    ?? (Array.isArray(controls) ? controls.find((c) => c?.name === "tokens" || c?.name === "token") : null);

  const tokenTools = tokenControl?.tools;
  if (!tokenTools) return;

  if (Array.isArray(tokenTools)) {
    for (const tool of tokenTools) {
      if (tool?.name in visibility) setToolVisible(tool, visibility[tool.name]);
    }
  } else if (typeof tokenTools === "object") {
    for (const [name, visible] of Object.entries(visibility)) {
      setToolVisible(tokenTools[name], visible);
    }
  }

  await controlsApp.render({ force: true, tool: controlsApp.tool?.name });
}
