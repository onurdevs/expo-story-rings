# expo-story-rings

Instagram-style story rings and full-screen viewer for React Native and Expo.

## Features

- **Story rings** — Horizontal list of avatar rings with labels
- **Full-screen viewer** — Modal with progress bar and safe area
- **Navigation** — Tap left/right for previous/next; close button and Android back
- **Auto-advance** — Configurable duration per story
- **Callbacks** — `onStoryOpen` and `onStoryClose`
- **Customization** — Ring color, duration, and container styles

## Install

```bash
npm install expo-story-rings react-native-safe-area-context
```

Your app root must be wrapped in `SafeAreaProvider` from `react-native-safe-area-context` (Expo templates usually include this).

## Usage

```tsx
import { Stories, type StoryItem } from 'expo-story-rings';

const items: StoryItem[] = [
  { id: '1', name: 'Campaign', image: 'https://example.com/1.jpg' },
  { id: '2', name: 'New', image: 'https://example.com/2.jpg' },
];

export default function Screen() {
  return (
    <Stories
      stories={items}
      storyDurationMs={5000}
      ringColor="#E1306C"
      onStoryOpen={(story, index) => console.log('Opened', story.name)}
      onStoryClose={() => console.log('Closed')}
    />
  );
}
```

## API

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `stories` | `StoryItem[]` | required | List of stories (order = viewing order) |
| `storyDurationMs` | `number` | `5000` | Duration per story in ms |
| `ringColor` | `string` | `'#E1306C'` | Ring border color (e.g. hex) |
| `style` | `ViewStyle` | — | Root container style |
| `contentContainerStyle` | `ViewStyle` | — | FlatList content container style |
| `onStoryOpen` | `(story, index) => void` | — | Called when user opens a story |
| `onStoryClose` | `() => void` | — | Called when the viewer closes |

### StoryItem

```ts
type StoryItem = {
  id: string | number;
  name: string;
  image: string;  // Image URI (HTTPS recommended)
};
```

## iOS & Android

- **Android** — Hardware back button closes the story viewer.
- **Both** — Full-screen size follows `useWindowDimensions()`, so rotation and multi-window work correctly.
- **Images** — Prefer HTTPS. For HTTP on Android you may need cleartext traffic configured in your app.

## Requirements

- React Native 0.70+
- `react-native-safe-area-context` 4.0+

## License

MIT

---

**[Onur Er](https://onurer.com.tr)**
