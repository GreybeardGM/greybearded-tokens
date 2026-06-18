# AGENTS.md

## Token rendering regression guard

Foundry VTT owns the placement, scale, rotation, and texture lifecycle of the core token artwork mesh (`token.mesh`). Do **not** patch token artwork fitting by writing to any of these properties in module runtime code:

- `token.mesh.position`
- `token.mesh.scale`
- `token.mesh.rotation`
- `token.mesh.texture`

Past regressions from changing these transforms caused token artworks to render in the wrong place, including all artwork appearing in the upper-left corner. Replacing `token.mesh.texture` also caused cropped artwork to render at the wrong effective size because Foundry had already scaled the mesh for the original texture. The module may add independent overlay containers for frames and mask sprites, but it must not reposition, rescale, rotate, or replace Foundry's core artwork mesh/texture to solve frame, mask, nameplate, or artwork-fit issues.

If token artwork placement appears wrong, prefer one of these approaches instead:

1. Leave Foundry's core artwork mesh transform untouched and adjust only Greybearded Token Frames overlays/masks/nameplates.
2. For cover-fit artwork behavior, prefer Foundry token document data or supported Foundry APIs/settings, such as the token texture `fit`, `anchorX`, and `anchorY` settings, when artwork behavior must change.
3. If Foundry settings are insufficient, implement cover-fit behavior with independent Greybearded overlay containers/sprites/masks rather than by replacing `token.mesh.texture`.
4. Document any unavoidable exception explicitly in the PR, including a manual Foundry scene test that proves normal, mirrored, masked, and differently-sized tokens still render correctly.

For Foundry-native cover fitting, do not assume `texture.anchorY = 0` means "crop only from the bottom." In Foundry's centered token mesh, that can place the artwork's top edge on the token center. If tall artwork should align to the token's top edge and crop only at the bottom, calculate a dynamic `texture.anchorY` from the source and token aspect ratios while keeping wide artwork horizontally centered.
