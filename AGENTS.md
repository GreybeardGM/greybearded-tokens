# AGENTS.md

## Token rendering regression guard

Foundry VTT owns the placement, scale, and rotation of the core token artwork mesh (`token.mesh`). Do **not** patch token artwork fitting by writing to any of these properties in module runtime code:

- `token.mesh.position`
- `token.mesh.scale`
- `token.mesh.rotation`

Past regressions from changing these transforms caused token artworks to render in the wrong place, including all artwork appearing in the upper-left corner. The module may add independent overlay containers for frames and mask sprites, and may crop the displayed artwork texture when cover-fit behavior is needed, but it must not reposition or rescale Foundry's core artwork mesh to solve frame, mask, nameplate, or artwork-fit issues.

If token artwork placement appears wrong, prefer one of these approaches instead:

1. Leave Foundry's core artwork mesh transform untouched and adjust only Greybearded Token Frames overlays/masks/nameplates.
2. For cover-fit artwork behavior, crop via the displayed PIXI texture/frame while preserving the mesh transform. Tall artwork should crop from the bottom; wide artwork should crop equally from the left and right.
3. Use token document data or supported Foundry APIs/settings when artwork behavior must change.
4. Document any unavoidable exception explicitly in the PR, including a manual Foundry scene test that proves normal, mirrored, masked, and differently-sized tokens still render correctly.
