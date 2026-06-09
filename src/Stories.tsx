import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Animated,
    BackHandler,
    FlatList,
    Linking,
    Modal,
    PanResponder,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';

import StoryProgressBar from './StoryProgressBar';
import type { StoriesProps, StoryItem } from './types';
import {
    filterActiveStories,
    getMediaUri,
    getStoryDurationMs,
    getThumbnailUri,
    isStorySeen,
} from './utils';

export type { StoryCTA, StoryItem, StoriesProps } from './types';

const DEFAULT_DURATION_MS = 5000;
const TICK_MS = 50;
const DEFAULT_RING_SIZE = 70;
const DEFAULT_RING_COLOR = '#E1306C';
const DEFAULT_RING_COLOR_SEEN = '#999999';
const DEFAULT_LABEL_COLOR = '#333333';
const DEFAULT_PROGRESS_COLOR = '#FFFFFF';

const Stories: React.FC<StoriesProps> = ({
    stories,
    storyDurationMs = DEFAULT_DURATION_MS,
    ringColor = DEFAULT_RING_COLOR,
    ringColorSeen = DEFAULT_RING_COLOR_SEEN,
    labelColor = DEFAULT_LABEL_COLOR,
    progressColor = DEFAULT_PROGRESS_COLOR,
    ringSize = DEFAULT_RING_SIZE,
    headerTitle,
    seenIds,
    contentContainerStyle,
    style,
    onStoryOpen,
    onStoryClose,
    onStoryView,
    onStoryComplete,
    onAllStoriesComplete,
    onSeenIdsChange,
    renderStoryOverlay,
}) => {
    const insets = useSafeAreaInsets();
    const { width, height } = useWindowDimensions();
    const activeStories = useMemo(() => filterActiveStories(stories), [stories]);

    const [selectedStory, setSelectedStory] = useState<StoryItem | null>(null);
    const [progress, setProgress] = useState(0);
    const [fullscreenImageError, setFullscreenImageError] = useState(false);
    const [failedThumbnails, setFailedThumbnails] = useState<Set<string | number>>(new Set());
    const [isPaused, setIsPaused] = useState(false);
    const panY = useRef(new Animated.Value(0)).current;
    const viewedStoryRef = useRef<string | number | null>(null);
    const isCompletingRef = useRef(false);

    const onStoryCloseRef = useRef(onStoryClose);
    const onStoryViewRef = useRef(onStoryView);
    const onStoryCompleteRef = useRef(onStoryComplete);
    const onAllStoriesCompleteRef = useRef(onAllStoriesComplete);
    const onSeenIdsChangeRef = useRef(onSeenIdsChange);

    onStoryCloseRef.current = onStoryClose;
    onStoryViewRef.current = onStoryView;
    onStoryCompleteRef.current = onStoryComplete;
    onAllStoriesCompleteRef.current = onAllStoriesComplete;
    onSeenIdsChangeRef.current = onSeenIdsChange;

    const currentIndex = selectedStory
        ? activeStories.findIndex((story) => story.id === selectedStory.id)
        : -1;

    const currentDurationMs =
        selectedStory && currentIndex >= 0
            ? getStoryDurationMs(selectedStory, storyDurationMs)
            : storyDurationMs;

    const isVideoStory = selectedStory?.type === 'video';
    const tickStep = TICK_MS / currentDurationMs;

    const ringStyles = useMemo(() => {
        const radius = ringSize / 2;
        const innerRadius = radius - 3;
        return {
            itemContainer: {
                width: ringSize,
                height: ringSize,
                borderRadius: radius,
            },
            item: {
                borderRadius: innerRadius,
            },
            nameText: {
                maxWidth: ringSize + 6,
            },
        };
    }, [ringSize]);

    const markSeen = useCallback(
        (story: StoryItem) => {
            if (isStorySeen(story, seenIds)) return;
            onSeenIdsChangeRef.current?.([...(seenIds ?? []), story.id]);
        },
        [seenIds]
    );

    const completeCurrentStory = useCallback(() => {
        if (!selectedStory || currentIndex < 0 || isCompletingRef.current) return;

        isCompletingRef.current = true;
        onStoryCompleteRef.current?.(selectedStory, currentIndex);

        const nextItem = activeStories[currentIndex + 1];
        if (nextItem) {
            setSelectedStory(nextItem);
            setProgress(0);
            return;
        }

        setSelectedStory(null);
        onAllStoriesCompleteRef.current?.();
        onStoryCloseRef.current?.();
    }, [activeStories, currentIndex, selectedStory]);

    const closeStory = useCallback(() => {
        setSelectedStory(null);
        onStoryCloseRef.current?.();
    }, []);

    const goToPrev = useCallback(() => {
        if (currentIndex <= 0) return;
        setSelectedStory(activeStories[currentIndex - 1]);
    }, [activeStories, currentIndex]);

    const goToNext = useCallback(() => {
        if (!selectedStory || currentIndex < 0) return;

        onStoryCompleteRef.current?.(selectedStory, currentIndex);

        if (currentIndex >= activeStories.length - 1) {
            setSelectedStory(null);
            onAllStoriesCompleteRef.current?.();
            onStoryCloseRef.current?.();
            return;
        }

        setSelectedStory(activeStories[currentIndex + 1]);
    }, [activeStories, currentIndex, selectedStory]);

    const openStory = useCallback(
        (story: StoryItem) => {
            const index = activeStories.findIndex((item) => item.id === story.id);
            setSelectedStory(story);
            onStoryOpen?.(story, index);
        },
        [activeStories, onStoryOpen]
    );

    const handleCtaPress = useCallback(async (story: StoryItem) => {
        if (!story.cta) return;

        if (story.cta.onPress) {
            story.cta.onPress();
            return;
        }

        if (story.cta.url) {
            const canOpen = await Linking.canOpenURL(story.cta.url);
            if (canOpen) {
                await Linking.openURL(story.cta.url);
            }
        }
    }, []);

    const handleVideoPlaybackUpdate = useCallback(
        (status: AVPlaybackStatus) => {
            if (!status.isLoaded || !selectedStory) return;

            if (status.durationMillis && status.durationMillis > 0) {
                setProgress(status.positionMillis / status.durationMillis);
            }

            if (status.didJustFinish && !status.isLooping) {
                completeCurrentStory();
            }
        },
        [completeCurrentStory, selectedStory]
    );

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 20,
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dy > 0) {
                    panY.setValue(gestureState.dy);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 100) {
                    closeStory();
                } else {
                    Animated.spring(panY, {
                        toValue: 0,
                        useNativeDriver: true,
                    }).start();
                }
            },
        })
    ).current;

    useEffect(() => {
        if (!selectedStory) {
            viewedStoryRef.current = null;
            isCompletingRef.current = false;
            return;
        }

        isCompletingRef.current = false;
        panY.setValue(0);
        setProgress(0);
        setFullscreenImageError(false);
        setIsPaused(false);
    }, [selectedStory, panY]);

    useEffect(() => {
        if (!selectedStory || viewedStoryRef.current === selectedStory.id) return;

        viewedStoryRef.current = selectedStory.id;
        const index = activeStories.findIndex((story) => story.id === selectedStory.id);
        onStoryViewRef.current?.(selectedStory, index);
        markSeen(selectedStory);
    }, [activeStories, markSeen, selectedStory]);

    useEffect(() => {
        if (!selectedStory || isPaused || isVideoStory) return;

        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 1) return 1;
                const next = prev + tickStep;
                return next >= 1 ? 1 : next;
            });
        }, TICK_MS);

        return () => clearInterval(interval);
    }, [isPaused, isVideoStory, selectedStory, tickStep]);

    useEffect(() => {
        if (!selectedStory || isPaused || isVideoStory || progress < 1) return;
        completeCurrentStory();
    }, [completeCurrentStory, isPaused, isVideoStory, progress, selectedStory]);

    useEffect(() => {
        if (!selectedStory || Platform.OS !== 'android') return;

        const onBack = () => {
            closeStory();
            return true;
        };

        const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
        return () => sub.remove();
    }, [closeStory, selectedStory]);

    const markThumbnailFailed = (id: string | number) => {
        setFailedThumbnails((prev) => new Set(prev).add(id));
    };

    if (!activeStories.length) return null;

    const mediaUri = selectedStory ? getMediaUri(selectedStory) : undefined;

    return (
        <View style={[styles.mainContainer, style]}>
            <FlatList
                data={activeStories}
                keyExtractor={(item) => String(item.id)}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[styles.listContent, contentContainerStyle]}
                renderItem={({ item }) => {
                    const thumbnailUri = getThumbnailUri(item);
                    const seen = isStorySeen(item, seenIds);

                    return (
                        <Pressable
                            onPress={() => openStory(item)}
                            style={styles.wrapper}
                            accessibilityRole="button"
                            accessibilityLabel={`Open story ${item.name}`}
                        >
                            <View
                                style={[
                                    styles.itemContainer,
                                    ringStyles.itemContainer,
                                    { borderColor: seen ? ringColorSeen : ringColor },
                                ]}
                            >
                                {failedThumbnails.has(item.id) || !thumbnailUri ? (
                                    <View
                                        style={[
                                            styles.item,
                                            ringStyles.item,
                                            styles.thumbnailPlaceholder,
                                        ]}
                                    >
                                        <Text style={styles.thumbnailPlaceholderText}>?</Text>
                                    </View>
                                ) : (
                                    <Image
                                        source={thumbnailUri}
                                        style={[styles.item, ringStyles.item]}
                                        onError={() => markThumbnailFailed(item.id)}
                                    />
                                )}
                            </View>
                            <Text
                                style={[styles.nameText, ringStyles.nameText, { color: labelColor }]}
                                numberOfLines={1}
                            >
                                {item.name}
                            </Text>
                        </Pressable>
                    );
                }}
            />

            <Modal
                visible={!!selectedStory}
                transparent
                animationType="fade"
                accessibilityLabel={
                    selectedStory ? `Story viewer: ${selectedStory.name}` : undefined
                }
            >
                <Animated.View
                    style={[styles.modalContainer, { transform: [{ translateY: panY }] }]}
                    {...panResponder.panHandlers}
                >
                    <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
                        <View style={styles.topBarContent}>
                            {headerTitle ? (
                                <Text style={styles.headerTitle} numberOfLines={1}>
                                    {headerTitle}
                                </Text>
                            ) : null}
                            <View style={styles.progressRow}>
                                <StoryProgressBar
                                    count={activeStories.length}
                                    currentIndex={Math.max(currentIndex, 0)}
                                    progress={progress}
                                    progressColor={progressColor}
                                />
                                <Pressable
                                    style={styles.closeButton}
                                    onPress={closeStory}
                                    hitSlop={12}
                                    accessibilityRole="button"
                                    accessibilityLabel="Close story"
                                >
                                    <Text style={styles.closeButtonText}>×</Text>
                                </Pressable>
                            </View>
                        </View>
                    </View>

                    <View style={styles.navTouchArea}>
                        <Pressable
                            style={styles.navLeft}
                            onPress={goToPrev}
                            onPressIn={() => setIsPaused(true)}
                            onPressOut={() => setIsPaused(false)}
                            accessibilityRole="button"
                            accessibilityLabel="Previous story"
                        />
                        <Pressable
                            style={styles.navRight}
                            onPress={goToNext}
                            onPressIn={() => setIsPaused(true)}
                            onPressOut={() => setIsPaused(false)}
                            accessibilityRole="button"
                            accessibilityLabel="Next story"
                        />
                    </View>

                    {selectedStory &&
                        (fullscreenImageError || !mediaUri ? (
                            <View style={[styles.fullImagePlaceholder, { width, height }]}>
                                <Text style={styles.fullImagePlaceholderText}>
                                    Couldn't load media
                                </Text>
                            </View>
                        ) : selectedStory.type === 'video' ? (
                            <Video
                                source={{ uri: mediaUri }}
                                style={[styles.fullImage, { width, height }]}
                                resizeMode={ResizeMode.COVER}
                                shouldPlay={!isPaused}
                                isLooping={false}
                                onPlaybackStatusUpdate={handleVideoPlaybackUpdate}
                                onError={() => setFullscreenImageError(true)}
                            />
                        ) : (
                            <Image
                                source={mediaUri}
                                style={[styles.fullImage, { width, height }]}
                                contentFit="cover"
                                onError={() => setFullscreenImageError(true)}
                            />
                        ))}

                    {selectedStory && renderStoryOverlay?.(selectedStory, Math.max(currentIndex, 0))}

                    {selectedStory?.cta ? (
                        <View style={[styles.ctaContainer, { paddingBottom: insets.bottom + 16 }]}>
                            <Pressable
                                style={[styles.ctaButton, { backgroundColor: ringColor }]}
                                onPress={() => handleCtaPress(selectedStory)}
                                accessibilityRole="button"
                                accessibilityLabel={selectedStory.cta.label}
                            >
                                <Text style={styles.ctaButtonText}>{selectedStory.cta.label}</Text>
                            </Pressable>
                        </View>
                    ) : null}
                </Animated.View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    mainContainer: { paddingVertical: 10 },
    listContent: { paddingLeft: 15 },
    wrapper: { alignItems: 'center', marginRight: 15 },
    itemContainer: {
        padding: 3,
        borderWidth: 2,
    },
    item: { width: '100%', height: '100%' },
    thumbnailPlaceholder: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    thumbnailPlaceholderText: { color: 'rgba(255,255,255,0.6)', fontSize: 24 },
    nameText: { fontSize: 11, marginTop: 4, textAlign: 'center' },

    modalContainer: {
        flex: 1,
        backgroundColor: 'black',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullImage: {},
    fullImagePlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.8)',
    },
    fullImagePlaceholderText: { color: 'rgba(255,255,255,0.7)', fontSize: 16 },
    topBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        paddingHorizontal: 16,
        paddingBottom: 14,
    },
    topBarContent: {
        gap: 8,
    },
    headerTitle: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    progressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    closeButton: { padding: 4, zIndex: 11 },
    closeButtonText: { fontSize: 32, color: 'white', lineHeight: 36, fontWeight: '300' },
    navTouchArea: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: 'row',
        zIndex: 5,
    },
    navLeft: { flex: 1 },
    navRight: { flex: 1 },
    ctaContainer: {
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: 0,
        zIndex: 12,
    },
    ctaButton: {
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: 'center',
    },
    ctaButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default Stories;
