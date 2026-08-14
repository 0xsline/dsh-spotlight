/**
 * Consumer-side runtime bundle for Git and tarball installs. The prepare
 * script emits declarations first, then this config bundles source without any
 * repository project references.
 */
export default [
  {
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
    clean: false,
    tsconfig: 'tsconfig.prepare.json',
  },
  {
    name: '@0xsline/dsh-spotlight/client',
    entry: { client: 'src/client/index.ts' },
    outDir: 'lib',
    format: ['cjs'],
    platform: 'browser',
    target: 'es2022',
    fixedExtension: false,
    dts: false,
    clean: false,
    tsconfig: 'tsconfig.prepare.json',
    outputOptions: {
      entryFileNames: 'client.js',
      banner: 'window.__ModuleLoader__.load({ id: "@0xsline/dsh-spotlight", factory: (require) => {',
      footer: 'return module.exports; } });',
      intro: 'var module = { exports: {} }; var exports = module.exports;',
    },
  },
]
