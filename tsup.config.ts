import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.tsx'],
    format: ['cjs', 'esm'],
    dts: true,
    sourcemap: true,
    clean: true,
    esbuildOptions(options) {
        options.jsx = 'automatic';
    },
    external: [
        'react',
        'react-native',
        'expo-image',
        'expo-av',
        'react-native-safe-area-context',
    ],
    outDir: 'dist',
});
