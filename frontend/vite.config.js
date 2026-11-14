import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The proxy makes the browser see React and Laravel as one origin
// (localhost:5173), so the session cookie and XSRF-TOKEN cookie just work
// and no CORS setup is needed during development.
const API_TARGET = process.env.VITE_API_TARGET ?? 'http://127.0.0.1:8000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: API_TARGET },
      '/sanctum': { target: API_TARGET },
    },
  },
});
