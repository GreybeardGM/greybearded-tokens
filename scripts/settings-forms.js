// settings.js — ColorsForm: DialogV2.input-Implementierung
import { invalidateGbFrameSettings } from "./settings-snapshot.js"; // Pfad ggf. anpassen
// MOD_ID und DEFAULT_COLORS importierst du bereits in deiner Datei

export class ColorsForm extends Application {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "gb-colors-form",
      title: "Colors",
      template: null,   // kein eigenes Template – wir nutzen DialogV2
      width: 480,
      popOut: false
    });
  }

  async render(force = false, options = {}) {
    // Aktuellen Stand holen
    const roles = ["hostile", "neutral", "friendly", "secret", "character"];
    const current = (() => {
      try { return game.settings.get(MOD_ID, "colors") || DEFAULT_COLORS; }
      catch { return DEFAULT_COLORS; }
    })();

    // Felder: je Rolle Text + Color-Picker
    const fields = [];
    for (const r of roles) {
      const val = current?.[r] ?? DEFAULT_COLORS[r] ?? "#000000";
      fields.push({
        type: "text",
        name: `${r}Text`,
        label: r, // Label links
        value: val,
        required: true
      });
      fields.push({
        type: "color",
        name: `${r}Pick`,
        label: "", // kein zweites Label in der Zeile
        value: val
      });
    }

    // Dialog anzeigen
    const { form, button } = await DialogV2.input({
      window: { title: "Greybearded Tokens — Colors" },
      buttons: [
        { label: "Cancel", action: "cancel" },
        { label: "Save",   action: "save" }
      ],
      content: "", // keine zusätzliche Beschreibung
      form: { fields }
    });

    if (button !== "save") return super.render(force, options);

    // Validierung und Zusammenführen
    const isHex = (v) => typeof v === "string" && /^#([0-9a-f]{6}|[0-9a-f]{8})$/i.test(v);
    const next = {};
    for (const r of roles) {
      const t = form[`${r}Text`];
      const c = form[`${r}Pick`];
      next[r] = isHex(t) ? t : (isHex(c) ? c : (current?.[r] ?? DEFAULT_COLORS[r]));
    }

    // Schreiben + Snapshot invalidieren
    await game.settings.set(MOD_ID, "colors", next);
    invalidateGbFrameSettings();

    // Optional: sanfter Repaint, falls du dafür bereits eine Utility hast
    // (Nicht zwingend – deine bestehende Hook-Kette auf Snapshot-Invalidierung reicht.)
    if (globalThis.sweepAllTokenFrames instanceof Function) {
      try { globalThis.sweepAllTokenFrames(); } catch (_) {}
    }

    return super.render(force, options);
  }
}
