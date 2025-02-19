const rules = [
  { type: 'feat', release: 'minor', title: 'New features' },
  { type: 'fix', release: 'patch', title: 'Bug fixes' },
  { type: 'refactor', release: 'patch', title: 'Code refactors' },
  { type: 'docs', release: 'patch', title: 'Documentation changes' },
  { type: 'chore', release: 'patch', title: 'Other changes' }
];

const sortMap = Object.fromEntries(rules.map((rule, index) => [rule.title, index]));

/**
 * @type {import('semantic-release').GlobalConfig}
 */
module.exports = {
  branches: ['main'],
  tagFormat: '${version}',
  plugins: [
    [
      '@semantic-release/commit-analyzer',
      {
        preset: 'conventionalcommits',
        releaseRules: [
          { breaking: true, release: 'major' },
          { revert: true, release: 'patch' }
        ].concat(rules.map(({ type, release }) => ({ type, release })))
      }
    ],
    [
      '@semantic-release/release-notes-generator',
      {
        preset: 'conventionalcommits',
        presetConfig: {
          types: rules.map(({ type, title }) => ({ type, section: title }))
        },
        writerOpts: {
          commitGroupsSort: (a, z) => sortMap[a.title] - sortMap[z.title]
        }
      }
    ],
    '@semantic-release/changelog',
    ['@semantic-release/npm', { npmPublish: false }],
    [
      '@semantic-release/git',
      {
        message: 'chore: create new release ${nextRelease.version}\n\n${nextRelease.notes}',
        assets: ['package.json', 'CHANGELOG.md']
      }
    ],
    [
      '@semantic-release/github',
      {
        draftRelease: false
      }
    ]
  ]
};
