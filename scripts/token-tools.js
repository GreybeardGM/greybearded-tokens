// modules/greybearded-tokens/scripts/token-tools.js
// GM-only. Kompatibel mit neuer Objekt-API (controls.tokens.tools)
// und älterer Array-API (controls[].tools[]).

Hooks.on('getSceneControlButtons', (controls) => {
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  const currSize = (td) => Math.max(Number(td.width) || 1, Number(td.height) || 1);

  const adjustToken = async (tokenDoc, direction) => {
    const current = currSize(tokenDoc);
    const base = direction < 0 ? Math.ceil(current) : Math.floor(current);
    const next = clamp(base + direction, 1, 15);
    if (next === current) return;
    await tokenDoc.update({ width: next, height: next });
  };

  const runOnSelection = async (direction) => {
    if (!game.user.isGM) return;
    const docs = canvas.tokens.controlled.map(t => t.document);
    if (!docs.length) return;
    await Promise.all(docs.map(td => adjustToken(td, direction)));
  };

  const shrinkTool = {
    name: 'gbShrink',
    title: 'Token verkleinern (min 1)',
    icon: 'fa-solid fa-down-left-and-up-right-to-center',
    button: true,
    visible: () => game.user.isGM,
    onClick: () => runOnSelection(-1),
    onChange: () => runOnSelection(-1) // neue API verwendet teils onChange
  };

  const growTool = {
    name: 'gbGrow',
    title: 'Token vergrößern (max 15)',
    icon: 'fa-solid fa-up-right-and-down-left-from-center',
    button: true,
    visible: () => game.user.isGM,
    onClick: () => runOnSelection(1),
    onChange: () => runOnSelection(1)
  };

  // Neuer Pfad (Foundry V13+): Objektstruktur
  const tokObj = controls?.tokens ?? controls?.token;
  if (tokObj && typeof tokObj.tools === 'object' && !Array.isArray(tokObj.tools)) {
    const orderBase = Object.keys(tokObj.tools).length;
    shrinkTool.order = orderBase + 1;
    growTool.order = orderBase + 2;
    tokObj.tools[shrinkTool.name] = shrinkTool;
    tokObj.tools[growTool.name] = growTool;
    return;
  }

  // Älterer Pfad: Arraystruktur
  const sets = Array.isArray(controls) ? controls : [];
  const tokenCtl = sets.find(c => c?.name === 'token' || c?.name === 'tokens');
  if (tokenCtl) {
    tokenCtl.tools ??= [];
    tokenCtl.tools.push(shrinkTool, growTool);
  }
});
