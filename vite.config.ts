import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const baseApiUrl = env.BASE_API_URL || env.VITE_BASE_API_URL || 'http://localhost:5001/api';
  const proxyTarget = baseApiUrl.replace(/\/api\/?$/, '');

  return {
    plugins: [react()],
    envPrefix: ['VITE_', 'BASE_'],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: proxyTarget || 'http://localhost:5001',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});

