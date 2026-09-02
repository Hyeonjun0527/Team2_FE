import path from 'path';
import { defineConfig, type UserConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const publicBasePath = env.VITE_PUBLIC_BASE_PATH || (mode === 'production' ? '/pull-it/' : '/');
  const developmentApiOrigin = env.PULLIT_DEV_API_ORIGIN?.trim();

  const developmentApiProxy = developmentApiOrigin
    ? {
        '/pull-it/api': {
          target: developmentApiOrigin,
          changeOrigin: true,
          secure: developmentApiOrigin.startsWith('https://'),
          rewrite: (requestPath: string) => requestPath.replace(/^\/pull-it/, ''),
          ws: true,
        },
        '/pull-it/auth': {
          target: developmentApiOrigin,
          changeOrigin: true,
          secure: developmentApiOrigin.startsWith('https://'),
          rewrite: (requestPath: string) => requestPath.replace(/^\/pull-it/, ''),
        },
        '/pull-it/oauth2': {
          target: developmentApiOrigin,
          changeOrigin: true,
          secure: developmentApiOrigin.startsWith('https://'),
          rewrite: (requestPath: string) => requestPath.replace(/^\/pull-it/, ''),
        },
        '/pull-it/login/oauth2': {
          target: developmentApiOrigin,
          changeOrigin: true,
          secure: developmentApiOrigin.startsWith('https://'),
          rewrite: (requestPath: string) => requestPath.replace(/^\/pull-it/, ''),
        },
      }
    : undefined;

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
      proxy: developmentApiProxy,
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
