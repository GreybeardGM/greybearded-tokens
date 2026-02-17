# Greybearded Token Frames

Greybearded Token Frames is a fast, dynamic token-framing toolkit for Foundry VTT.

Designed for busy Game Masters who are tired of creating custom token artwork for every single actor, this module offers a quick and flexible way to style tokens at runtime. It can automatically add a configurable frame to any character portrait, optionally layer a secondary frame with different tint behavior, and apply a mask—so tokens are generated dynamically during play without requiring manually prepared token art files.

## Features

- Primary token frame plus an optional secondary token frame with separate image paths
- Optional token mask
- Tinting with selectable modes (plus optional player-color override where available)
- Nameplate customization (font family, size, and color)
- Includes an additional set of configurable Scene Control tools for quick token manipulation


### Tint Modes

The module supports the following tint modes in frame/nameplate settings:

- **No Tint**
- **Unicolor**
- **Disposition**
- **Ownership**
- **Actor Type**
- **Custom**

## Installation

1. Open **Add-on Modules** in Foundry VTT.
2. Click **Install Module**.
3. Paste this manifest URL:

   ```
   https://raw.githubusercontent.com/GreybeardGM/greybearded-tokens/main/module.json
   ```

4. Install the module and enable it in your world setup.

For release notes and upgrade details, see the [Changelog](./CHANGELOG.md).

## Compatibility

- **Minimum:** Foundry VTT v12
- **Verified:** Foundry VTT v13.351

## ⚠️ Resource Usage & Operational Notes

This module hooks into the token rendering lifecycle (including `refreshToken`, `updateToken`, and global sweeps across all canvas tokens). In larger scenes with many visible tokens, this can increase GPU/CPU load.

### Critical High-Load Areas

- **Many visible tokens:** Each refresh can trigger frame/mask updates.
- **Masks enabled:** Mask sprites are managed per token and updated for size/mirroring changes.
- **Color/user changes:** Relevant user updates can trigger another sweep across all tokens.
- **Large frame/mask textures:** Higher resolutions increase memory usage and GPU upload costs.

### Quick Emergency Mitigation Guide

If a scene starts stuttering or frametimes increase:

1. **Disable secondary frame and/or mask** (largest immediate impact).
2. **Reduce visible token count** (split scenes, keep fewer active tokens in view).
3. **Use smaller/compressed frame and mask images** (lower texture sizes).
4. **Simplify nameplate scaling** (disable it or reduce aggressive font scaling).
5. **Disable frame per problematic token** via token flag (`disableFrame`).

Recommendation: apply one change at a time and re-check performance, so you can keep visual quality while removing only the most expensive settings.

## Development

For release notes and upgrade details, see the [Changelog](./CHANGELOG.md).

Clone the repository and place it in your Foundry modules directory:

```bash
git clone https://github.com/GreybeardGM/greybearded-tokens.git
```

## License

This project is licensed under the [MIT License](./LICENSE).
