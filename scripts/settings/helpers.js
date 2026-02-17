// modules/greybearded-tokens/scripts/utils/helpers.js

/** Strikte HEX-Validierung (#RRGGBB oder #RRGGBBAA) */
export const HEX_RE = /^#([0-9a-f]{6}|[0-9a-f]{8})$/i;
export const isHex  = (v) => (typeof v === "string") && HEX_RE.test(v);

export function str(v, fb = "") {
  return (typeof v === "string" && v.length) ? v : fb;
}

/** Validiert String gegen Choice-Map (z. B. TINT_CHOICES). */
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

  const syncTextToColor = () => {
    if (isHex(textEl.value)) colorEl.value = textEl.value;
  };

  const syncColorToText = () => {
    if (isHex(colorEl.value)) textEl.value = colorEl.value;
  };

  textEl.addEventListener("input", syncTextToColor);
  textEl.addEventListener("change", syncTextToColor);
  colorEl.addEventListener("input", syncColorToText);
  colorEl.addEventListener("change", syncColorToText);
}

/** Mehrere Paare nach Namenskonvention "<name>-text" / "<name>-color" binden. */
export function bindHexPairs(root, names) {
  for (const n of names) {
    const t = root.querySelector(`input[name="${n}-text"]`);
    const c = root.querySelector(`input[name="${n}-color"]`);
    bindHexSync(t, c);
  }
}


/**
 * Rendert SceneControls neu und nutzt reset=true, damit Tool-Definitionen sauber neu aufgebaut werden.
 */
export async function refreshSceneControls() {
  if (!ui?.controls || !canvas?.ready) return;

  const prev = {
    control: ui.controls.control?.name,
    tool: ui.controls.tool?.name
  };

  await ui.controls.render({
    ...prev,
    reset: true,
    force: true
  });
}


/** Font-Familien ausschließlich aus Foundry-Config beziehen (alphabetisch, dedupliziert). */
export function getConfiguredFontFamilies() {
  const families = Object.keys(CONFIG?.fontDefinitions ?? {});
  return [...new Set(families)]
    .filter((family) => typeof family === "string" && family.trim().length)
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}
