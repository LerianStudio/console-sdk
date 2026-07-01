import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: { index: 'src/index.ts' },
    format: ['esm'],
    target: 'node18',
    dts: true,
    clean: true,
    splitting: false,
  },
  {
    entry: { cli: 'src/cli.ts' },
    format: ['esm'],
    target: 'node18',
    dts: false,
    clean: false,
    splitting: false,
    banner: {
      js: '#!/usr/bin/env node',
    },
  },
])
