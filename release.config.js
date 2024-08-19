/**
 * @type {import('semantic-release').GlobalConfig}
 */
export default {
  branches: ['main'],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/npm',
    '@sebbo2002/semantic-release-jsr',
    [
      '@semantic-release/github',
      {
        assets: [
          {
            path: 'dist/index.js',
            name: 'uncover-el-${nextRelease.gitTag}.js',
            label: 'Uncover-el (${nextRelease.gitTag}) ES Module',
          },
          {
            path: 'dist/index.iife.js',
            name: 'uncover-el-${nextRelease.gitTag}.iife.js',
            label: 'Uncover-el (${nextRelease.gitTag}) IIFE Script',
          },
        ],
      },
    ],
  ],
}
