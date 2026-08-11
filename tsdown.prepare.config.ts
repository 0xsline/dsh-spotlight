import { defineConfig } from 'tsdown'

/**
 * Consumer-side build for git installs. It transpiles source without the
 * sibling DSH project references; development and CI own type checking.
 */
export default defineConfig({
  entry: {
    index: 'src/index.ts',
    invariant: 'src/invariant.ts',
  },
  outDir: 'lib',
  format: ['esm'],
  platform: 'node',
  target: 'es2024',
  fixedExtension: false,
  dts: false,
  clean: true,
  tsconfig: 'tsconfig.prepare.json',
})
