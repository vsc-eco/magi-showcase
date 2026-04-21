import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
	plugins: [react()],
	test: {
		environment: 'jsdom',
		globals: true,
		setupFiles: ['./tests/setup.ts']
	},
	resolve: {
		alias: {
			// Pin test-file react imports to the root copy. Duplicate
			// React across @magi/widget is prevented by pnpm's default
			// hoisting, not by this alias; the alias just keeps test
			// code from drifting if something weird resolves react.
			react: path.resolve(__dirname, 'node_modules/react'),
			'react-dom': path.resolve(__dirname, 'node_modules/react-dom')
		}
	}
});
