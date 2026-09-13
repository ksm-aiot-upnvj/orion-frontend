import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  server: {
    port: 3000,
    open: true,
    allowedHosts: true
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        registration: resolve(__dirname, 'pages/registration.html'),
        profile: resolve(__dirname, 'pages/profile.html'),
        selection: resolve(__dirname, 'pages/selection.html'),
        members: resolve(__dirname, 'pages/members.html'),
        inventory: resolve(__dirname, 'pages/inventory.html'),
        finance: resolve(__dirname, 'pages/finance.html'),
        archive: resolve(__dirname, 'pages/archive.html')
      }
    }
  }
});
