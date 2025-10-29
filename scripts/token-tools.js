// token-tools.js
Hooks.on('getSceneControlButtons', (controls) => {
  // VTT-Varianten abfangen: Array | {controls:[...]} | sonst
  const sets = Array.isArray(controls) ? controls : controls?.controls ?? [];
  if (!Array.isArray(sets) || !sets.length) return;

  // "token" vs. "tokens" absichern
  const tokenCtl = sets.find(c => c?.name === 'token' || c?.name === 'tokens');
  if (!tokenCtl) return;

  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  const currSize = (td) => {
    const w = Number(td.width) || 1;
    const h = Number(td.height) || 1;
    return Math.max(w, h, 1);
  };

  // direction: -1 = verkleinern (ceil), +1 = vergrößern (floor)
  const adjustToken = async (tokenDoc, direction) => {
    const current = currSize(tokenDoc);
    const base = direction < 0 ? Math.ceil(current) : Math.floor(current);
    const next = clamp(base + direction, 1, 15);
    if (next === current) return;
    await tokenDoc.update({ width: next, height: next });
  };

  const runOnSelection = async (direction) => {
    if (!game.user.isGM) return; // doppelt absichern
    const docs = canvas.tokens.controlled.map(t => t.document);
    if (!docs.length) return;
    await Promise.all(docs.map(td => adjustToken(td, direction)));
  };

  tokenCtl.tools.push(
    {
      name: 'shrink-one',
      title: 'Token verkleinern (min 1)',
      icon: 'fa-solid fa-down-left-and-up-right-to-center',
      button: true,
      visible: () => game.user.isGM,
      onClick: () => runOnSelection(-1)
    },
    {
      name: 'grow-one',
      title: 'Token vergrößern (max 15)',
      icon: 'fa-solid fa-up-right-and-down-left-from-center',
      button: true,
      visible: () => game.user.isGM,
      onClick: () => runOnSelection(1)
    }
  );
});
