# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.1] - Unknown

### Added
- _No entries yet._

## [0.2.0] - 2026-02-17

Baseline release of **Greybearded Token Frames** for Foundry VTT with dynamic, configurable token styling.

### Added
- Configurable primary and optional secondary token frame support.
- Optional token mask support.
- Multiple tint modes for frames/nameplates: No Tint, Unicolor, Disposition, Ownership, Actor Type, and Custom.
- Nameplate styling options (font family, size, color).
- Additional scene-control token tools for quick token manipulation.

### Changed
- Established `0.2.0` as the baseline release line for ongoing release documentation.

### Fixed
- Baseline release includes no separately tracked hotfix items.

### Performance
- Token rendering updates run at runtime; large scenes and high-resolution assets can have measurable performance impact.

### Known Issues
- In scenes with many visible tokens, repeated refresh/update cycles can increase GPU/CPU load.
- Masks and large frame textures can increase rendering and memory costs.
- Mitigation guidance is available in the README section **Resource Usage & Operational Notes**.
