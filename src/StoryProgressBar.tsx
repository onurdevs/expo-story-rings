import React from 'react';
import { StyleSheet, View } from 'react-native';

type StoryProgressBarProps = {
    count: number;
    currentIndex: number;
    progress: number;
    progressColor: string;
    trackColor?: string;
};

const StoryProgressBar: React.FC<StoryProgressBarProps> = ({
    count,
    currentIndex,
    progress,
    progressColor,
    trackColor = 'rgba(255,255,255,0.35)',
}) => {
    if (count <= 0) return null;

    const clampedProgress = Math.min(Math.max(progress, 0), 1);
    const overallPercent = Math.round(((currentIndex + clampedProgress) / count) * 100);

    return (
        <View
            style={styles.container}
            accessibilityLabel="Story progress"
            accessibilityValue={{
                now: overallPercent,
                min: 0,
                max: 100,
            }}
        >
            {Array.from({ length: count }, (_, index) => {
                let fill = 0;
                if (index < currentIndex) {
                    fill = 1;
                } else if (index === currentIndex) {
                    fill = clampedProgress;
                }

                return (
                    <View key={index} style={[styles.segmentTrack, { backgroundColor: trackColor }]}>
                        <View
                            style={[
                                styles.segmentFill,
                                { width: `${fill * 100}%`, backgroundColor: progressColor },
                            ]}
                        />
                    </View>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    segmentTrack: {
        flex: 1,
        height: 4,
        borderRadius: 2,
        overflow: 'hidden',
    },
    segmentFill: {
        height: '100%',
        borderRadius: 2,
    },
});

export default StoryProgressBar;
