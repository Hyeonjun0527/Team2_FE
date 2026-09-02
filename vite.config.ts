import path from 'path';
import { defineConfig, type UserConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const publicBasePath = env.VITE_PUBLIC_BASE_PATH || (mode === 'production' ? '/pull-it/' : '/');

  const config: UserConfig = {
    base: publicBasePath,
    plugins: [react(), svgr()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    assetsInclude: ['**/*.lottie'],
    server: {
      host: 'localhost',
      port: 5173,
      https: {
        key: path.resolve(__dirname, 'localhost-key.pem'),
        cert: path.resolve(__dirname, 'localhost.pem'),
      },
      proxy: {
        '/api/notifications/subscribe': {
          target: env.VITE_API_BASE_URL,
          changeOrigin: true,
          secure: false,
          ws: true,
        },
      },
    },
  };

  if (mode === 'production') {
    config.build = {
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: false,
          drop_debugger: false,
        },
      },
    };
  }

  return config;
});
