import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import * as fs from 'fs';

export default defineConfig(({ mode }) => {
  // Try to read .env.local directly
  let apiKey = '';
  try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      const match = envContent.match(/(?:VITE_)?GEMINI_API_KEY=(.+)/);
      if (match) {
        apiKey = match[1].trim();
      }
    }
  } catch (e) {
    console.error('Error reading .env.local:', e);
  }

  // Fallback to loadEnv
  if (!apiKey) {
    const env = loadEnv(mode, process.cwd(), '');
    apiKey = env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || '';
  }

  console.log('[Vite] API Key loaded:', apiKey ? 'Yes (length: ' + apiKey.length + ')' : 'No');

  return {
    base: '/Smart_Elevator/',
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(apiKey),
      'process.env.GEMINI_API_KEY': JSON.stringify(apiKey),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
