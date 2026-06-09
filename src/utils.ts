import type { StoryItem } from './types';

export function filterActiveStories(stories: StoryItem[]): StoryItem[] {
    const now = Date.now();
    return stories.filter((story) => {
        if (story.publishAt && new Date(story.publishAt).getTime() > now) {
            return false;
        }
        if (story.expiresAt && new Date(story.expiresAt).getTime() <= now) {
            return false;
        }
        return true;
    });
}

export function getThumbnailUri(story: StoryItem): string | undefined {
    return story.thumbnail ?? story.url ?? story.image;
}

export function getMediaUri(story: StoryItem): string | undefined {
    return story.url ?? story.image;
}

export function getStoryDurationMs(story: StoryItem, defaultDurationMs: number): number {
    return story.durationMs ?? defaultDurationMs;
}

export function isStorySeen(
    story: StoryItem,
    seenIds?: (string | number)[]
): boolean {
    if (story.seen) return true;
    return seenIds?.includes(story.id) ?? false;
}
