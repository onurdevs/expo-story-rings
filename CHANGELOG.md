# Changelog

## 2.0.0

### Added

- Segmented progress bar for multi-story playback
- `thumbnail` field separate from full-screen `url`
- Per-story `durationMs` override
- Video auto-advance on playback finish (no looping)
- CTA button support (`cta.label`, `cta.onPress`, `cta.url`)
- Seen state via `seenIds`, `onSeenIdsChange`, and `seen` on items
- Analytics callbacks: `onStoryView`, `onStoryComplete`, `onAllStoriesComplete`
- Brand props: `ringColorSeen`, `labelColor`, `progressColor`, `ringSize`, `headerTitle`
- `renderStoryOverlay` for custom viewer content
- `publishAt` / `expiresAt` scheduling on `StoryItem`
- Example Expo app in `example/`
- CI workflow and `tsup` build to `dist/`

### Changed

- Positioning focused on single-organization / brand stories
- Package entry points: `dist/` for npm, `src/` via `react-native` field for Metro

## 1.0.3

- Video support, expo-image, gestures (long press pause, swipe down close)

## 1.0.0

- Initial release
