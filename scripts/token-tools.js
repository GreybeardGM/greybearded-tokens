// modules/greybearded-tokens/scripts/token-tools.js
// Zwei Größen-Buttons + drittes Tool: disableFrame-Flag per ausgewähltem Token toggeln (GM-only).

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
      const cur = !!(await td.getFlag('greybearded-tokens', 'disableFrame'));
      const next = !cur;
      // setFlag statt unsetFlag für deterministisches Verhalten
      await td.setFlag('greybearded-tokens', 'disableFrame', next);
    }));
  };

  const shrinkTool = {
    name: 'gbShrink',
    title: 'Token verkleinern (min 1)',
    icon: 'fa-solid fa-down-left-and-up-right-to-center',
    button: true,
    visible: () => game.user.isGM,
    onClick: () => runOnSelectionSize(-1),
    onChange: () => runOnSelectionSize(-1)
  };

  const growTool = {
    name: 'gbGrow',
    title: 'Token vergrößern (max 15)',
    icon: 'fa-solid fa-up-right-and-down-left-from-center',
    button: true,
    visible: () => game.user.isGM,
    onClick: () => runOnSelectionSize(1),
    onChange: () => runOnSelectionSize(1)
  };

  const toggleFrameTool = {
    name: 'gbToggleFrame',
    title: 'Frame-Flag toggeln',
    icon: 'fa-solid fa-vector-square',
    button: true,
    visible: () => game.user.isGM,
    onClick: () => runToggleDisableFrame(),
    onChange: () => runToggleDisableFrame()
  };

  // Neuer Objekt-Pfad (Foundry V13+)
  const tokObj = controls?.tokens ?? controls?.token;
  if (tokObj && typeof tokObj.tools === 'object' && !Array.isArray(tokObj.tools)) {
    const base = Object.keys(tokObj.tools).length;
    shrinkTool.order = base + 1;
    growTool.order   = base + 2;
    toggleFrameTool.order = base + 3;
    tokObj.tools[shrinkTool.name]   = shrinkTool;
    tokObj.tools[growTool.name]     = growTool;
    tokObj.tools[toggleFrameTool.name] = toggleFrameTool;
    return;
  }

  // Älterer Array-Pfad
  const sets = Array.isArray(controls) ? controls : [];
  const tokenCtl = sets.find(c => c?.name === 'token' || c?.name === 'tokens');
  if (tokenCtl) {
    tokenCtl.tools ??= [];
    tokenCtl.tools.push(shrinkTool, growTool, toggleFrameTool);
  }
});
