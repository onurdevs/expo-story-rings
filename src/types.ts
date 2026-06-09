import type { ReactNode } from 'react';
import type { ViewStyle } from 'react-native';

export type StoryCTA = {
    label: string;
    onPress?: () => void;
    url?: string;
};

export type StoryItem = {
    id: string | number;
    name: string;
    image?: string;
    url?: string;
    thumbnail?: string;
    type?: 'image' | 'video';
    durationMs?: number;
    seen?: boolean;
    cta?: StoryCTA;
    expiresAt?: string;
    publishAt?: string;
};

export type StoriesProps = {
    stories: StoryItem[];
    storyDurationMs?: number;
    ringColor?: string;
    ringColorSeen?: string;
    labelColor?: string;
    progressColor?: string;
    ringSize?: number;
    headerTitle?: string;
    seenIds?: (string | number)[];
    contentContainerStyle?: ViewStyle;
    style?: ViewStyle;
    onStoryOpen?: (story: StoryItem, index: number) => void;
    onStoryClose?: () => void;
    onStoryView?: (story: StoryItem, index: number) => void;
    onStoryComplete?: (story: StoryItem, index: number) => void;
    onAllStoriesComplete?: () => void;
    onSeenIdsChange?: (seenIds: (string | number)[]) => void;
    renderStoryOverlay?: (story: StoryItem, index: number) => ReactNode;
};
