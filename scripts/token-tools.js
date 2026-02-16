// modules/greybearded-tokens/scripts/token-tools.js
import { updateFrame } from "./apply-frame.js";
import { MOD_ID, DEFAULT_DISPOSITION_COLORS } from "./settings/constants.js";
import { normalizeTokenToolsConfig } from "./utils/normalization.js";

Hooks.on('getSceneControlButtons', (controls) => {
  const toolConfig = normalizeTokenToolsConfig(game.settings.get(MOD_ID, 'tokenTools'));


  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  const currSize = (td) => Math.max(Number(td.width) || 1, Number(td.height) || 1);

  const adjustToken = async (tokenDoc, direction) => {
    const current = currSize(tokenDoc);
    const base = direction < 0 ? Math.ceil(current) : Math.floor(current);
    const next = clamp(base + direction, toolConfig.sizeMin, toolConfig.sizeMax);
    if (next === current) return;
    await tokenDoc.update({ width: next, height: next });
  };

  const runOnSelectionSize = async (direction) => {
    if (!game.user.isGM) return;
    const docs = canvas.tokens.controlled.map(t => t.document);
    if (!docs.length) return;
    await Promise.all(docs.map(td => adjustToken(td, direction)));
  };

  const runToggleDisableFrame = async () => {
    if (!game.user.isGM) return;
    const docs = canvas.tokens.controlled.map(t => t.document);
    if (!docs.length) return;

    // Pro Token invertieren: true -> false, false/undefined -> true
    await Promise.all(docs.map(async (td) => {
      const cur = !!(await td.getFlag(MOD_ID, 'disableFrame'));
      const next = !cur;
      // setFlag statt unsetFlag für deterministisches Verhalten
      await td.setFlag(MOD_ID, 'disableFrame', next);
      updateFrame(td);
    }));
  };

  const runMirrorArtwork = async () => {
    if (!game.user.isGM) return;

    const docs = canvas.tokens.controlled.map((t) => t.document);
    if (!docs.length) return;

    await Promise.all(docs.map(async (td) => {
      const currentScaleX = Number(td.texture?.scaleX);
      const magnitude = Math.abs(Number.isFinite(currentScaleX) && currentScaleX !== 0 ? currentScaleX : 1);
      await td.update({
        texture: {
          scaleX: -magnitude
        }
      });
    }));
  };

  const runSetDisposition = async () => {
    if (!game.user.isGM) return;

    const docs = canvas.tokens.controlled.map((t) => t.document);
    if (!docs.length) {
      ui.notifications?.warn(game.i18n.localize('GBT.Tools.Disposition.NoneSelected'));
      return;
    }

    const dispositionEntries = [
      { key: 'HOSTILE', label: 'GBT.Disposition.hostile', colorKey: 'hostile' },
      { key: 'NEUTRAL', label: 'GBT.Disposition.neutral', colorKey: 'neutral' },
      { key: 'FRIENDLY', label: 'GBT.Disposition.friendly', colorKey: 'friendly' },
      { key: 'SECRET', label: 'GBT.Disposition.secret', colorKey: 'secret' }
    ].filter(({ key }) => Number.isInteger(CONST.TOKEN_DISPOSITIONS?.[key]));

    if (!dispositionEntries.length) return;

    const dispositionMeta = {
      HOSTILE: 'fa-solid fa-skull-crossbones',
      NEUTRAL: 'fa-solid fa-scale-balanced',
      FRIENDLY: 'fa-solid fa-handshake',
      SECRET: 'fa-solid fa-user-secret'
    };

    const dispositionColors = game.settings.get(MOD_ID, 'colors') ?? DEFAULT_DISPOSITION_COLORS;

    const disposition = await foundry.applications.api.DialogV2.wait({
      window: {
        title: game.i18n.localize('GBT.Tools.Disposition.Title'),
        contentClasses: ['gbt-frames']
      },
      content: `<p>${game.i18n.localize('GBT.Tools.Disposition.Content')}</p>`,
      buttons: dispositionEntries.map(({ key, label, colorKey }) => {
        const dispositionColor = dispositionColors[colorKey] ?? DEFAULT_DISPOSITION_COLORS[colorKey];

        return {
          action: key.toLowerCase(),
          label: game.i18n.localize(label),
          icon: dispositionMeta[key] ?? 'fa-solid fa-circle',
          class: 'colored-icon',
          style: { '--gbt-disposition-color': dispositionColor },
          default: key === dispositionEntries[0].key,
          callback: () => CONST.TOKEN_DISPOSITIONS[key]
        };
      })
    });

    if (!Number.isInteger(disposition)) return;

    await Promise.all(docs.map((td) => td.update({ disposition })));

    const linkedActors = new Set(
      docs
        .filter((td) => td.actorLink && td.actor)
        .map((td) => td.actor)
    );

    await Promise.all(Array.from(linkedActors, (actor) => actor.update({ 'prototypeToken.disposition': disposition })));
  };

  const shrinkTool = {
    name: 'gbShrink',
    title: `Token verkleinern (min ${toolConfig.sizeMin})`,
    icon: 'fa-solid fa-down-left-and-up-right-to-center',
    button: true,
    visible: game.user.isGM && toolConfig.size,
    onChange: () => runOnSelectionSize(-1)
  };

  const growTool = {
    name: 'gbGrow',
    title: `Token vergrößern (max ${toolConfig.sizeMax})`,
    icon: 'fa-solid fa-up-right-and-down-left-from-center',
    button: true,
    visible: game.user.isGM && toolConfig.size,
    onChange: () => runOnSelectionSize(1)
  };

  const toggleFrameTool = {
    name: 'gbToggleFrame',
    title: 'Frame-Flag toggeln',
    icon: 'fa-solid fa-vector-square',
    button: true,
    visible: game.user.isGM && toolConfig.toggleFrame,
    onChange: () => runToggleDisableFrame()
  };

  const mirrorArtworkTool = {
    name: 'gbMirrorArtwork',
    title: game.i18n.localize('GBT.Tools.MirrorArtwork.ToolTitle'),
    icon: 'fa-solid fa-left-right',
    button: true,
    visible: game.user.isGM && toolConfig.mirrorArtwork,
    onChange: () => runMirrorArtwork()
  };

  const setDispositionTool = {
    name: 'gbSetDisposition',
    title: game.i18n.localize('GBT.Tools.Disposition.ToolTitle'),
    icon: 'fa-solid fa-people-arrows-left-right',
    button: true,
    visible: game.user.isGM && toolConfig.disposition,
    onChange: () => runSetDisposition()
  };

  // Foundry V13-Zielpfad: objektbasierte Scene Controls
  const tokenControl = controls?.tokens;
  if (!tokenControl || typeof tokenControl.tools !== 'object' || Array.isArray(tokenControl.tools)) return;

  const moduleTools = [shrinkTool, growTool, toggleFrameTool, mirrorArtworkTool, setDispositionTool];
  const base = Object.keys(tokenControl.tools).length;

  moduleTools.forEach((tool, index) => {
    tool.order = base + index + 1;
    tokenControl.tools[tool.name] = tool;
  });
});
