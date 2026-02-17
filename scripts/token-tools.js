// modules/greybearded-tokens/scripts/token-tools.js
import { updateFrame } from "./apply-frame.js";
import { MOD_ID, DEFAULT_DISPOSITION_COLORS } from "./settings/constants.js";
import { normalizeTokenToolsConfig } from "./utils/normalization.js";
import { isHex, bindHexSync } from "./settings/helpers.js";

const DISPOSITION_ENTRIES = [
  { key: "HOSTILE", label: "GBT.Disposition.hostile", colorKey: "hostile" },
  { key: "NEUTRAL", label: "GBT.Disposition.neutral", colorKey: "neutral" },
  { key: "FRIENDLY", label: "GBT.Disposition.friendly", colorKey: "friendly" },
  { key: "SECRET", label: "GBT.Disposition.secret", colorKey: "secret" }
];

const DISPOSITION_META = {
  HOSTILE: "fa-solid fa-skull-crossbones",
  NEUTRAL: "fa-solid fa-scale-balanced",
  FRIENDLY: "fa-solid fa-handshake",
  SECRET: "fa-solid fa-user-secret"
};

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const currSize = (td) => Math.max(Number(td.width) || 1, Number(td.height) || 1);
const getControlledTokenDocs = () => canvas.tokens.controlled.map((t) => t.document);
const getRenderedTokenObject = (tokenDoc) => tokenDoc?.object ?? canvas.tokens?.get(tokenDoc?.id) ?? null;

const createSizeTools = ({ isGM, toolConfig, runOnSelectionSize }) => ([
  {
    name: "gbShrink",
    title: `Token verkleinern (min ${toolConfig.sizeMin})`,
    icon: "fa-solid fa-down-left-and-up-right-to-center",
    button: true,
    visible: isGM && toolConfig.size,
    onChange: () => runOnSelectionSize(-1)
  },
  {
    name: "gbGrow",
    title: `Token vergrößern (max ${toolConfig.sizeMax})`,
    icon: "fa-solid fa-up-right-and-down-left-from-center",
    button: true,
    visible: isGM && toolConfig.size,
    onChange: () => runOnSelectionSize(1)
  }
]);

const createToggleFrameTool = ({ isGM, visible, runToggleDisableFrame }) => ({
  name: "gbToggleFrame",
  title: "Frame-Flag toggeln",
  icon: "fa-solid fa-vector-square",
  button: true,
  visible: isGM && visible,
  onChange: () => runToggleDisableFrame()
});

const createMirrorArtworkTool = ({ isGM, visible, runMirrorArtwork }) => ({
  name: "gbMirrorArtwork",
  title: game.i18n.localize("GBT.Tools.MirrorArtwork.ToolTitle"),
  icon: "fa-solid fa-left-right",
  button: true,
  visible: isGM && visible,
  onChange: () => runMirrorArtwork()
});

const createDispositionTool = ({ isGM, visible, runSetDisposition }) => ({
  name: "gbSetDisposition",
  title: game.i18n.localize("GBT.Tools.Disposition.ToolTitle"),
  icon: "fa-solid fa-people-arrows-left-right",
  button: true,
  visible: isGM && visible,
  onChange: () => runSetDisposition()
});

const createCustomTintTool = ({ isGM, visible, runSetCustomTint }) => ({
  name: "gbSetCustomTint",
  title: game.i18n.localize("GBT.Tools.CustomTint.ToolTitle"),
  icon: "fa-solid fa-eye-dropper",
  button: true,
  visible: isGM && visible,
  onChange: () => runSetCustomTint()
});

const registerModuleTools = (tokenControl, tools) => {
  const base = Object.keys(tokenControl.tools).length;

  tools.forEach((tool, index) => {
    tokenControl.tools[tool.name] = {
      ...tool,
      order: base + index + 1
    };
  });
};

Hooks.on('getSceneControlButtons', (controls) => {
  const toolConfig = normalizeTokenToolsConfig(game.settings.get(MOD_ID, 'tokenTools'));
  const isGM = game.user.isGM;

  // Foundry V13-Zielpfad: objektbasierte Scene Controls
  const tokenControl = controls?.tokens;
  if (!tokenControl || typeof tokenControl.tools !== 'object' || Array.isArray(tokenControl.tools)) return;

  const adjustToken = async (tokenDoc, direction) => {
    const current = currSize(tokenDoc);
    const base = direction < 0 ? Math.ceil(current) : Math.floor(current);
    const next = clamp(base + direction, toolConfig.sizeMin, toolConfig.sizeMax);
    if (next === current) return;
    await tokenDoc.update({ width: next, height: next });
  };

  const runOnSelectionSize = async (direction) => {
    if (!isGM) return;
    const docs = getControlledTokenDocs();
    if (!docs.length) return;
    await Promise.all(docs.map(td => adjustToken(td, direction)));
  };

  const runToggleDisableFrame = async () => {
    if (!isGM) return;
    const docs = getControlledTokenDocs();
    if (!docs.length) return;

    // Pro Token invertieren: true -> false, false/undefined -> true
    await Promise.all(docs.map(async (td) => {
      const cur = !!(await td.getFlag(MOD_ID, 'disableFrame'));
      const next = !cur;
      // setFlag statt unsetFlag für deterministisches Verhalten
      await td.setFlag(MOD_ID, 'disableFrame', next);

      const tokenObj = getRenderedTokenObject(td);
      if (!tokenObj) return;
      updateFrame(tokenObj);
    }));
  };

  const runMirrorArtwork = async () => {
    if (!isGM) return;
    const docs = getControlledTokenDocs();
    if (!docs.length) return;

    await Promise.all(docs.map(async (td) => {
      const rawScaleX = Number(td.texture?.scaleX);
      const currentScaleX = Number.isFinite(rawScaleX) && rawScaleX !== 0 ? rawScaleX : 1;
      await td.update({
        texture: {
          scaleX: -currentScaleX
        }
      });
    }));
  };

  const runSetDisposition = async () => {
    if (!isGM) return;
    const docs = getControlledTokenDocs();
    if (!docs.length) {
      ui.notifications?.warn(game.i18n.localize('GBT.Tools.Disposition.NoneSelected'));
      return;
    }

    const dispositionEntries = DISPOSITION_ENTRIES.filter(({ key }) => Number.isInteger(CONST.TOKEN_DISPOSITIONS?.[key]));

    if (!dispositionEntries.length) return;

    const dispositionColors = game.settings.get(MOD_ID, 'colors') ?? DEFAULT_DISPOSITION_COLORS;

    const disposition = await foundry.applications.api.DialogV2.wait({
      window: {
        title: game.i18n.localize('GBT.Tools.Disposition.Title'),
        contentClasses: ['gbtf-token-tools-disposition-dialog']
      },
      content: `<p>${game.i18n.localize('GBT.Tools.Disposition.Content')}</p>`,
      buttons: dispositionEntries.map(({ key, label, colorKey }) => {
        const dispositionColor = dispositionColors[colorKey] ?? DEFAULT_DISPOSITION_COLORS[colorKey];

        return {
          action: key.toLowerCase(),
          label: game.i18n.localize(label),
          icon: DISPOSITION_META[key] ?? 'fa-solid fa-circle',
          class: 'colored-icon',
          style: { '--gbtf-disposition-color': dispositionColor },
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


  const runSetCustomTint = async () => {
    if (!isGM) return;
    const docs = getControlledTokenDocs();
    if (!docs.length) {
      ui.notifications?.warn(game.i18n.localize('GBT.Tools.CustomTint.NoneSelected'));
      return;
    }

    const firstColor = docs
      .map((td) => td.getFlag(MOD_ID, 'customTint'))
      .find((color) => isHex(color)) ?? '#888888';

    const content = `
      <div class="gbtf-token-tools-custom-tint-dialog">
        <p>${game.i18n.localize('GBT.Tools.CustomTint.Content')}</p>
        <div class="form-group">
          <label for="gbtf-custom-tint-text">${game.i18n.localize('GBT.Common.ColorHex')}</label>
          <input id="gbtf-custom-tint-text" type="text" name="custom-tint-text" value="${firstColor}" placeholder="#RRGGBB" />
        </div>
        <div class="form-group">
          <label for="gbtf-custom-tint-color">${game.i18n.localize('GBT.Common.ColorPicker')}</label>
          <input id="gbtf-custom-tint-color" type="color" name="custom-tint-color" value="${firstColor}" />
        </div>
      </div>
    `;

    let textInput;
    let colorInput;

    const result = await foundry.applications.api.DialogV2.wait({
      window: {
        title: game.i18n.localize('GBT.Tools.CustomTint.Title'),
        contentClasses: ['gbtf-token-tools-custom-tint-dialog']
      },
      content,
      buttons: [
        {
          action: 'save',
          label: game.i18n.localize('GBT.Common.Save'),
          icon: 'fa-solid fa-floppy-disk',
          callback: () => {
            const textValue = textInput?.value?.trim();
            const colorValue = colorInput?.value?.trim();
            if (isHex(textValue)) return textValue;
            if (isHex(colorValue)) return colorValue;
            return null;
          }
        },
        {
          action: 'cancel',
          label: game.i18n.localize('GBT.Common.Cancel'),
          icon: 'fa-regular fa-circle-xmark',
          default: true,
          callback: () => null
        }
      ],
      render: (_event, dialog) => {
        const element = dialog?.element;
        textInput = element?.querySelector('input[name="custom-tint-text"]');
        colorInput = element?.querySelector('input[name="custom-tint-color"]');
        bindHexSync(textInput, colorInput);
      }
    });

    if (!isHex(result)) {
      if (result !== null) {
        ui.notifications?.warn(game.i18n.localize('GBT.Common.InvalidHex'));
      }
      return;
    }

    await Promise.all(docs.map((td) => td.setFlag(MOD_ID, 'customTint', result)));

    for (const td of docs) {
      const tokenObj = getRenderedTokenObject(td);
      if (!tokenObj) continue;
      updateFrame(tokenObj);
    }
  };

  const moduleTools = [
    ...createSizeTools({ isGM, toolConfig, runOnSelectionSize }),
    createToggleFrameTool({ isGM, visible: toolConfig.toggleFrame, runToggleDisableFrame }),
    createMirrorArtworkTool({ isGM, visible: toolConfig.mirrorArtwork, runMirrorArtwork }),
    createDispositionTool({ isGM, visible: toolConfig.disposition, runSetDisposition }),
    createCustomTintTool({ isGM, visible: toolConfig.customTint, runSetCustomTint })
  ];

  registerModuleTools(tokenControl, moduleTools);
});
