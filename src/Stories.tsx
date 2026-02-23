import React, { useEffect, useRef, useState } from 'react';
import {
    BackHandler,
    FlatList,
    Image,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
    ViewStyle,
    useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type StoryItem = {
    id: string | number;
    name: string;
    image: string;
};

export type StoriesProps = {
    stories: StoryItem[];
    storyDurationMs?: number;
    ringColor?: string;
    contentContainerStyle?: ViewStyle;
    style?: ViewStyle;
    onStoryOpen?: (story: StoryItem, index: number) => void;
    onStoryClose?: () => void;
};

const DEFAULT_DURATION_MS = 5000;
const TICK_MS = 50;

const Stories: React.FC<StoriesProps> = ({
    stories,
    storyDurationMs = DEFAULT_DURATION_MS,
    ringColor = '#E1306C',
    contentContainerStyle,
    style,
    onStoryOpen,
    onStoryClose,
}) => {
    const insets = useSafeAreaInsets();
    const { width, height } = useWindowDimensions();
    const [selectedStory, setSelectedStory] = useState<StoryItem | null>(null);
    const [progress, setProgress] = useState(0);
    const [fullscreenImageError, setFullscreenImageError] = useState(false);
    const [failedThumbnails, setFailedThumbnails] = useState<Set<string | number>>(new Set());
    const onStoryCloseRef = useRef(onStoryClose);
    onStoryCloseRef.current = onStoryClose;

    const tickStep = TICK_MS / storyDurationMs;

    useEffect(() => {
        if (!selectedStory) return;
        setProgress(0);
        setFullscreenImageError(false);
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 1) {
                    const currentIndex = stories.findIndex((s) => s.id === selectedStory.id);
                    const nextItem = stories[currentIndex + 1];
                    if (nextItem) {
                        setSelectedStory(nextItem);
                        return 0;
                    }
                    setSelectedStory(null);
                    onStoryCloseRef.current?.();
                    return 1;
                }
                return prev + tickStep;
            });
        }, TICK_MS);
        return () => clearInterval(interval);
    }, [selectedStory, tickStep, stories]);

    const currentIndex = selectedStory ? stories.findIndex((s) => s.id === selectedStory.id) : -1;

    const goToPrev = () => {
        if (currentIndex <= 0) return;
        setSelectedStory(stories[currentIndex - 1]);
    };

    const goToNext = () => {
        if (currentIndex >= stories.length - 1) {
            setSelectedStory(null);
            onStoryCloseRef.current?.();
            return;
        }
        setSelectedStory(stories[currentIndex + 1]);
    };

    const openStory = (story: StoryItem) => {
        setSelectedStory(story);
        onStoryOpen?.(story, stories.findIndex((s) => s.id === story.id));
    };
    const closeStory = () => {
        setSelectedStory(null);
        onStoryCloseRef.current?.();
    };

    useEffect(() => {
        if (!selectedStory || Platform.OS !== 'android') return;
        const onBack = () => {
            closeStory();
            return true;
        };
        BackHandler.addEventListener('hardwareBackPress', onBack);
        return () => BackHandler.removeEventListener('hardwareBackPress', onBack);
    }, [selectedStory]);

    const markThumbnailFailed = (id: string | number) => {
        setFailedThumbnails((prev) => new Set(prev).add(id));
    };

    if (!stories.length) return null;

    return (
        <View style={[styles.mainContainer, style]}>
            <FlatList
                data={stories}
                keyExtractor={(item) => String(item.id)}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[styles.listContent, contentContainerStyle]}
                renderItem={({ item }) => (
                    <Pressable
                        onPress={() => openStory(item)}
                        style={styles.wrapper}
                        accessibilityRole="button"
                        accessibilityLabel={`Open story ${item.name}`}
                    >
                        <View style={[styles.itemContainer, { borderColor: ringColor }]}>
                            {failedThumbnails.has(item.id) ? (
                                <View style={[styles.item, styles.thumbnailPlaceholder]}>
                                    <Text style={styles.thumbnailPlaceholderText}>?</Text>
                                </View>
                            ) : (
                                <Image
                                    source={{ uri: item.image }}
                                    style={styles.item}
                                    onError={() => markThumbnailFailed(item.id)}
                                />
                            )}
                        </View>
                        <Text style={styles.nameText} numberOfLines={1}>
                            {item.name}
                        </Text>
                    </Pressable>
                )}
            />

            <Modal
                visible={!!selectedStory}
                transparent
                animationType="fade"
                accessibilityLabel={selectedStory ? `Story viewer: ${selectedStory.name}` : undefined}
            >
                <View style={styles.modalContainer}>
                    <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
                        <View
                            style={styles.progressBarBackground}
                            accessibilityLabel="Story progress"
                            // iOS accessibilityValue prefers integer values; using percent avoids
                            // 'Loss of precision during arithmetic conversion' crash on long long
                            accessibilityValue={{
                                now: Math.round(progress * 100),
                                min: 0,
                                max: 100,
                            }}
                        >
                            <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
                        </View>
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

                    <View style={styles.navTouchArea}>
                        <Pressable
                            style={styles.navLeft}
                            onPress={goToPrev}
                            accessibilityRole="button"
                            accessibilityLabel="Previous story"
                        />
                        <Pressable
                            style={styles.navRight}
                            onPress={goToNext}
                            accessibilityRole="button"
                            accessibilityLabel="Next story"
                        />
                    </View>

                    {selectedStory &&
                        (fullscreenImageError ? (
                            <View style={[styles.fullImagePlaceholder, { width, height }]}>
                                <Text style={styles.fullImagePlaceholderText}>
                                    Couldn't load image
                                </Text>
                            </View>
                        ) : (
                            <Image
                                source={{ uri: selectedStory.image }}
                                style={[styles.fullImage, { width, height }]}
                                resizeMode="cover"
                                onError={() => setFullscreenImageError(true)}
                            />
                        ))}
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    mainContainer: { paddingVertical: 10 },
    listContent: { paddingLeft: 15 },
    wrapper: { alignItems: 'center', marginRight: 15 },
    itemContainer: {
        width: 70,
        height: 70,
        padding: 3,
        borderRadius: 35,
        borderWidth: 2,
    },
    item: { width: '100%', height: '100%', borderRadius: 35 },
    thumbnailPlaceholder: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    thumbnailPlaceholderText: { color: 'rgba(255,255,255,0.6)', fontSize: 24 },
    nameText: { fontSize: 11, marginTop: 4, textAlign: 'center', maxWidth: 76 },

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
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingBottom: 14,
    },
    progressBarBackground: {
        flex: 1,
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.35)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressBarFill: { height: '100%', backgroundColor: 'white', borderRadius: 2 },
    closeButton: { padding: 4, zIndex: 11 },
    closeButtonText: { fontSize: 32, color: 'white', lineHeight: 36, fontWeight: '300' },
    navTouchArea: {
        ...StyleSheet.absoluteFillObject,
        flexDirection: 'row',
        zIndex: 5,
    },
    navLeft: { flex: 1 },
    navRight: { flex: 1 },
});

export default Stories;
