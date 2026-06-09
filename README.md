# expo-story-rings

Brand and organization story rings with a full-screen viewer for React Native and Expo.

Display campaigns, announcements, and promotions in an Instagram-style horizontal ring strip — designed for **a single organization** publishing multiple stories, not a multi-user social feed.

## Features

- **Story rings** — Horizontal list of labeled campaign rings with thumbnails
- **Full-screen viewer** — Modal with segmented progress bar and safe area
- **Navigation** — Tap left/right for previous/next; close button and Android back
- **Interactive gestures** — Long press to pause, swipe down to close
- **Media support** — Cached images (`expo-image`) and video (`expo-av`)
- **Auto-advance** — Global or per-story duration; videos advance when playback finishes
- **CTA buttons** — Call-to-action on each story (e.g. "Shop now", "Learn more")
- **Seen state** — Dim rings for viewed stories
- **Analytics callbacks** — `onStoryView`, `onStoryComplete`, `onAllStoriesComplete`
- **Scheduling** — `publishAt` / `expiresAt` filter stories automatically
- **Customization** — Ring size, colors, header title, and custom overlays

## Install

```bash
npm install expo-story-rings react-native-safe-area-context expo-image expo-av
```

Wrap your app root in `SafeAreaProvider` from `react-native-safe-area-context`.

## Usage

```tsx
import { useState } from 'react';
import { Stories, type StoryItem } from 'expo-story-rings';

const items: StoryItem[] = [
  {
    id: '1',
    name: 'Campaign',
    thumbnail: 'https://example.com/thumb-1.jpg',
    url: 'https://example.com/full-1.jpg',
    cta: { label: 'Shop now', url: 'https://example.com/shop' },
  },
  {
    id: '2',
    name: 'New',
    thumbnail: 'https://example.com/thumb-2.jpg',
    url: 'https://example.com/promo.mp4',
    type: 'video',
    durationMs: 8000,
  },
];

export default function Screen() {
  const [seenIds, setSeenIds] = useState<(string | number)[]>([]);

  return (
    <Stories
      stories={items}
      seenIds={seenIds}
      onSeenIdsChange={setSeenIds}
      storyDurationMs={5000}
      ringColor="#E1306C"
      ringColorSeen="#BBBBBB"
      headerTitle="Announcements"
      onStoryView={(story, index) => console.log('Viewed', story.name, index)}
      onStoryComplete={(story, index) => console.log('Completed', story.name, index)}
      onAllStoriesComplete={() => console.log('All stories done')}
    />
  );
}
```

## API

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `stories` | `StoryItem[]` | required | Active stories (order = viewing order) |
| `storyDurationMs` | `number` | `5000` | Default duration per image story |
| `ringColor` | `string` | `'#E1306C'` | Ring border for unseen stories |
| `ringColorSeen` | `string` | `'#999999'` | Ring border for seen stories |
| `labelColor` | `string` | `'#333333'` | Ring label text color |
| `progressColor` | `string` | `'#FFFFFF'` | Progress bar fill color |
| `ringSize` | `number` | `70` | Ring diameter in pixels |
| `headerTitle` | `string` | — | Title shown in the viewer top bar |
| `seenIds` | `(string \| number)[]` | — | Controlled list of viewed story IDs |
| `style` | `ViewStyle` | — | Root container style |
| `contentContainerStyle` | `ViewStyle` | — | FlatList content container style |
| `onStoryOpen` | `(story, index) => void` | — | User opened a story |
| `onStoryClose` | `() => void` | — | Viewer closed |
| `onStoryView` | `(story, index) => void` | — | Story became visible in viewer |
| `onStoryComplete` | `(story, index) => void` | — | Story finished or user skipped forward |
| `onAllStoriesComplete` | `() => void` | — | Last story completed |
| `onSeenIdsChange` | `(ids) => void` | — | New story marked as seen |
| `renderStoryOverlay` | `(story, index) => ReactNode` | — | Custom overlay content |

### StoryItem

```ts
type StoryCTA = {
  label: string;
  onPress?: () => void;
  url?: string;
};

type StoryItem = {
  id: string | number;
  name: string;
  thumbnail?: string;       // Ring preview (falls back to url/image)
  url?: string;             // Full-screen media URI
  image?: string;           // Legacy fallback URI
  type?: 'image' | 'video'; // defaults to 'image'
  durationMs?: number;      // Override global duration for this story
  seen?: boolean;           // Mark as seen in data
  cta?: StoryCTA;
  expiresAt?: string;       // ISO date — hidden after expiry
  publishAt?: string;       // ISO date — hidden until published
};
```

## Example app

```bash
cd example
npm install
npx expo start
```

The example links the local library via `"expo-story-rings": "file:.."`. If Metro fails to resolve modules after dependency changes, reset Watchman:

```bash
watchman watch-del '..' ; watchman watch-project .
```

To test the published tarball locally: `npm run sync-library` (packs the library into `example/vendor/`).

## iOS & Android

- **Android** — Hardware back closes the viewer.
- **Both** — Full-screen size follows `useWindowDimensions()`.
- **Media** — Prefer HTTPS URLs.

## Requirements

- React Native 0.70+
- `react-native-safe-area-context` 4.0+
- `expo-image` 1.0+
- `expo-av` 13.0+

## License

MIT

---

**[Onur Er](https://onurer.com.tr)**
