import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

const testConfig =  defineWorkersConfig({
	test: {
		poolOptions: {
			workers: {
				wrangler: { configPath: './wrangler.toml' },
			},
		},
    coverage: {
      provider: 'istanbul',
      exclude: ['test', 'lib'],
    },
	},
});

export default testConfig;