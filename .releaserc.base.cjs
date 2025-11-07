// .releaserc.base.cjs
module.exports = {
  plugins: [
    ["@semantic-release/commit-analyzer", {
      preset: "conventionalcommits",
      parserOpts: { noteKeywords: ["BREAKING CHANGE", "BREAKING CHANGES"] },
      releaseRules: [
        { type: "feat", release: "minor" },
        { type: "perf", release: "minor" },
        { type: "build", release: "minor" },
        { type: "chore", release: "patch" },
        { type: "ci", release: "patch" },
        { type: "test", release: "patch" },
        { type: "fix", release: "patch" },
        { type: "refactor", release: "minor" },
        { type: "docs", release: "patch" },
        { breaking: true, release: "major" }
      ]
    }],
    ["@semantic-release/release-notes-generator", { preset: "conventionalcommits" }]
  ],
  branches: [
    { name: "main" },                    // stable releases (npm tag: latest)
    { name: "develop", prerelease: "beta" }, // pre-releases like 1.0.0-beta.X (npm tag: develop)
    { name: "hotfix/*", prerelease: false, channel: false } // disabled
    // { name: "release-candidate", prerelease: "rc" }, // optional
  ]
};
