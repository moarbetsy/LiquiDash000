import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base: '/LiquiDash000/',
      css: {
        postcss: './postcss.config.js'
      },
      build: {
        sourcemap: true,
        rollupOptions: {
          onwarn(warning, defaultHandler) {
            // Ignore all warnings from framer-motion
            if (/node_modules\/framer-motion/.test(warning.id || '')) {
              return
            }
            defaultHandler(warning)
          },
          output: {
            manualChunks: {
              vendor: ['react', 'react-dom'],
              firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
              charts: ['recharts'],
              motion: ['framer-motion'],
              icons: ['lucide-react']
            }
          }
        }
      },
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, 'src'),
        }
      }
    };
});
