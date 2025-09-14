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
              charts: ['recharts'],
              motion: ['framer-motion'],
              icons: ['lucide-react']
            }
          }
        }
      },
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        // Database environment variables
        'process.env.DATABASE_URL': JSON.stringify(env.DATABASE_URL),
        'process.env.DB_USER': JSON.stringify(env.DB_USER),
        'process.env.DB_PASSWORD': JSON.stringify(env.DB_PASSWORD),
        'process.env.DB_HOST': JSON.stringify(env.DB_HOST),
        'process.env.DB_PORT': JSON.stringify(env.DB_PORT),
        'process.env.DB_NAME': JSON.stringify(env.DB_NAME),
        'process.env.SUPABASE_URL': JSON.stringify(env.SUPABASE_URL),
        'process.env.SUPABASE_ANON_KEY': JSON.stringify(env.SUPABASE_ANON_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, 'src'),
        }
      }
    };
});
