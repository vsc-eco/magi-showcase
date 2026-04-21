import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { shikiHighlight } from './src/vite-plugin-shiki';

export default defineConfig({
	plugins: [react(), shikiHighlight()],
	server: { port: 5173 }
});
