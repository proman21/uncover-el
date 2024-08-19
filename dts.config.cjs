// @ts-check
/** @type import('dts-bundle-generator/config-schema').BundlerConfig */
const config = {
  entries: [
    {
      filePath: './lib/mod.ts',
      outFile: './dist/index.d.ts',
      noCheck: false,
      output: {
        exportReferencedTypes: false,
      },
    },
  ],
}

module.exports = config
