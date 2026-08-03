import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
// `vitest/config` rather than `vite`: same function, but its types know about
// the `test` block below. Importing from `vite` typechecks as an unknown key.
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// adapter-node, not adapter-auto. The roadmap's settled decision is a
			// single TypeScript monolith in one container beside Postgres, so the
			// build target is already known. adapter-auto infers its target from CI
			// environment variables and falls back with a warning locally, which
			// makes builds unreproducible.
			adapter: adapter()
		})
	],
	test: {
		include: ['src/**/*.test.ts'],
		environment: 'node'
	}
});
