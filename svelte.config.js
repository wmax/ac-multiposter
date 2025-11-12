import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),
	kit: {
		// Using Cloudflare Pages adapter for deployment
		adapter: adapter({
			// Path to wrangler configuration file
			config: 'wrangler.jsonc',
			// Enable platform emulation during dev/preview
			platformProxy: {
				persist: true
			}
		}),
		experimental: {
			remoteFunctions: true
		},
		alias: {
			"@/*": "./lib/*"
		}
	},
	compilerOptions: {
		experimental: {
			async: true
		}
	}
};

export default config;
