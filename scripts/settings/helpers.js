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

/** Scene Controls aktualisieren, ohne einen kompletten Seiten-Reload zu erzwingen. */
export async function refreshSceneControls() {
  if (!ui?.controls || !canvas?.ready) return;

  const controls = ui.controls;
  const activeLayer = canvas.activeLayer;
  const activeControl = controls.activeControl ?? controls.control?.name ?? controls.currentControl;
  const activeTool = controls.activeTool ?? controls.tool;
  const renderOptions = { controls: activeControl, tool: activeTool };

  let refreshed = false;

  if (typeof controls.render === "function") {
    try {
      await controls.render({ force: true, ...renderOptions });
      refreshed = true;
    } catch {
      try {
        await controls.render(true, renderOptions);
        refreshed = true;
      } catch {
        // Fallback auf legacy API folgt unten.
      }
    }
  }

  if (!refreshed && typeof controls.initialize === "function") {
    await controls.initialize({
      layer: activeLayer,
      control: activeControl,
      tool: activeTool
    });
    controls.render?.(true);
  }

  if (activeLayer && canvas.activeLayer !== activeLayer && typeof activeLayer.activate === "function") {
    activeLayer.activate({ tool: activeTool });
  }
}
