import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Stories, type StoryItem } from 'expo-story-rings';

const STORIES: StoryItem[] = [
  {
    id: 'campaign',
    name: 'Campaign',
    thumbnail: 'https://picsum.photos/seed/campaign-thumb/200/200',
    url: 'https://picsum.photos/seed/campaign-full/1080/1920',
    durationMs: 4000,
    cta: {
      label: 'View offer',
      onPress: () => Alert.alert('CTA', 'Campaign offer opened'),
    },
  },
  {
    id: 'new',
    name: 'New',
    thumbnail: 'https://picsum.photos/seed/new-thumb/200/200',
    url: 'https://picsum.photos/seed/new-full/1080/1920',
  },
  {
    id: 'expired',
    name: 'Expired',
    thumbnail: 'https://picsum.photos/seed/expired-thumb/200/200',
    url: 'https://picsum.photos/seed/expired-full/1080/1920',
    expiresAt: '2020-01-01T00:00:00.000Z',
  },
];

export default function App() {
  const [seenIds, setSeenIds] = useState<(string | number)[]>([]);
  const [events, setEvents] = useState<string[]>([]);

  const log = (message: string) => {
    setEvents((prev) => [message, ...prev].slice(0, 6));
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <Text style={styles.title}>Brand Stories Demo</Text>
        <Text style={styles.subtitle}>Single-organization story rings</Text>

        <Stories
          stories={STORIES}
          seenIds={seenIds}
          onSeenIdsChange={setSeenIds}
          ringColor="#2563EB"
          ringColorSeen="#CBD5E1"
          labelColor="#1E293B"
          progressColor="#FFFFFF"
          headerTitle="Announcements"
          storyDurationMs={5000}
          onStoryOpen={(story) => log(`Opened: ${story.name}`)}
          onStoryView={(story) => log(`Viewed: ${story.name}`)}
          onStoryComplete={(story) => log(`Completed: ${story.name}`)}
          onAllStoriesComplete={() => log('All stories completed')}
          onStoryClose={() => log('Viewer closed')}
          renderStoryOverlay={(story) => (
            <View style={styles.overlayBadge}>
              <Text style={styles.overlayText}>{story.name}</Text>
            </View>
          )}
        />

        <View style={styles.events}>
          <Text style={styles.eventsTitle}>Events</Text>
          <ScrollView>
            {events.length === 0 ? (
              <Text style={styles.eventItem}>Open a story to see callbacks.</Text>
            ) : (
              events.map((event, index) => (
                <Text key={`${event}-${index}`} style={styles.eventItem}>
                  {event}
                </Text>
              ))
            )}
          </ScrollView>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  overlayBadge: {
    position: 'absolute',
    top: 120,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: 20,
  },
  overlayText: {
    color: 'white',
    fontWeight: '600',
  },
  events: {
    flex: 1,
    marginTop: 24,
    paddingHorizontal: 16,
  },
  eventsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#334155',
  },
  eventItem: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 6,
  },
});
