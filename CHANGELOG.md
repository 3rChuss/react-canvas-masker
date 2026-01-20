# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-01-20

### Added

- **initialMask prop**: Added `initialMask?: string` prop to `MaskEditor` to pre-load a mask provided as a base64 data URL (e.g., saved from `toMask()`), enabling resuming editing sessions or switching between saved masks.
  - The mask is applied once per unique value (to avoid redundant re-applications).
  - When applied it overwrites the current mask canvas, saves the state in history (so undo/redo works from that base), and notifies `onMaskChange` immediately.
- **Storybook demo**: Added a reliable "Pre-load existing mask" story demonstrating save → clear → load workflow (includes a forced reload mechanism so the same mask value can be re-applied).
- **Tests**: Added tests (Vitest + Testing Library) to validate `initialMask` behavior and subsequent editing.

### Changed

- **Package version bumped** to `1.2.0`.

## [1.1.1] - 2025-08-05

### Fixed

- **Improved zoom and pan**: Fixed a critical issue where zoom didn't correctly maintain the point under the cursor.
- **Coordinate calculation correction**: Implemented a new mathematical formula for zoom that correctly accounts for CSS transformation.
- **Keyboard zoom**: Fixed zoom behavior via keyboard shortcuts to follow the current mouse position.
- **Zoom behavior**: Eliminated axis inversion when zooming at different positions of the image.
- **Transformation consistency**: Unified logic for all zoom operations (wheel, buttons, shortcuts) to ensure coherent behavior.

### Improved

- **Performance**: Optimized transformation calculations to reduce re-renders.
- **Code structure**: Refactored the `zoomToPoint` function for better readability and maintainability.

### Technical Detail

The main technical change has been correcting the transformation calculation applied during zoom. The new implementation:

1. Correctly calculates the image point under the cursor before zooming
2. Applies an improved mathematical formula that considers the order of CSS transformations:
   ```css
   transform: translate(-50%, -50%) scale(effectiveScale)
     translate(translateX, translateY);
   ```
3. Uses the correct sign for translation values, considering that CSS `translate` moves the element in the specified direction, but to keep a point under the cursor requires the opposite movement

## [1.1.0] - Previous version

See commit history for more details about previous changes.
