# Repository Instructions

## Regression safeguards
- Prefer Foundry and PIXI APIs over custom implementations whenever they provide the required behavior.
- Avoid silent fallback behavior for new code. If a fallback is necessary, keep it narrow and make invalid configuration or unexpected runtime states observable where practical.
- Keep rendering-path safeguards lightweight. Before adding retries, global sweeps, or repeated scheduling, document why the guard is needed and avoid duplicate microtask/requestAnimationFrame batching.
- Keep rendering functions focused and readable. Split frame, mask, nameplate, cleanup, and scheduling logic into small helpers instead of growing large all-in-one functions.
- Do not add one-off helpers unless they either remove meaningful duplication, isolate Foundry/PIXI-specific behavior, or document a non-obvious domain concept.
- Keep normalization helpers in `scripts/utils/normalisation.js` and import them directly from there instead of using re-export facades or duplicating parsing in feature modules.
