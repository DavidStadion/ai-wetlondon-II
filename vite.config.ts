import { defineConfig, loadEnv } from 'vite';
import preact from '@preact/preset-vite';

// `npm run dev` proxies /api to the local server (npm run dev:api).
// Set VITE_API_PROXY=https://wetlondon.co.uk to borrow the deployed API instead —
// useful for reviewing real Google Places photography without a local API key.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = env.VITE_API_PROXY || 'http://localhost:3000';

  return {
    plugins: [preact()],
    resolve: {
      alias: { '@': '/src' }
    },
    server: {
      proxy: {
        '/api': {
          target,
          changeOrigin: true,
          rewrite: (path) => path
        }
      }
    }
  };
});
