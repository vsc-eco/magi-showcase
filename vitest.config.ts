import { defineConfig, mergeConfig } from 'vitest/config';
import path from 'node:path';
import viteConfig from './vite.config';

// mergeConfig so Vite plugin changes (react, shiki highlighter) are
// picked up by tests automatically; no duplicated plugin list.
export default mergeConfig(
	viteConfig,
	defineConfig({
		test: {
			environment: 'jsdom',
			globals: true,
			setupFiles: ['./tests/setup.ts']
		},
		resolve: {
			alias: {
				// Pin test-file react imports to the root copy. Cross-package
				// React dedup is handled by pnpm's hoisting, not this alias.
				react: path.resolve(__dirname, 'node_modules/react'),
				'react-dom': path.resolve(__dirname, 'node_modules/react-dom')
			}
		}
	})
);
