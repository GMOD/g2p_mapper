## [2.2.0](https://github.com/GMOD/g2p_mapper/compare/v2.1.7...v2.2.0) (2026-10-08)

### Chores

- Render only the commit subject, and link the commit ([8890ace](https://github.com/GMOD/g2p_mapper/commit/8890ace1d5695909250383a498b446fb424bfbbe))
- Create a GitHub release for each published tag ([e9cb38b](https://github.com/GMOD/g2p_mapper/commit/e9cb38b2f085059ce2dd50de7acfbf3ec32bc3db))
- Enforce type strippability in tsconfig, align eslint rules ([555ef8c](https://github.com/GMOD/g2p_mapper/commit/555ef8cc52119ca2bd56cd25413fcc538d7d6e88))
- Keep agent worktrees out of the toolchain's way ([299630c](https://github.com/GMOD/g2p_mapper/commit/299630ca5db54a000c3189e1494c6ea22a91c0bf))

### Documentation

- Fix anti-AI writing tropes in the footnote ([9a507d5](https://github.com/GMOD/g2p_mapper/commit/9a507d5ab095cd281232c9b62f929ec4edc15e4f))
- Restructure README into bullets, add docs/ with mapping flowchart ([28404ac](https://github.com/GMOD/g2p_mapper/commit/28404ac473f73ad84c4e48df90b097ca719a69bd))
- Show a concrete input feature in the README usage ([4aba448](https://github.com/GMOD/g2p_mapper/commit/4aba4484311c862a4f05e80ac070640f2ff8ae95))
- Show @gmod/gff-nostream feeding the mapper ([1ce6143](https://github.com/GMOD/g2p_mapper/commit/1ce6143bdf9a98075f55cb01a59347241fe72882))
- Add a reverse-strand example, test the README examples, widen keywords ([c8ed1cb](https://github.com/GMOD/g2p_mapper/commit/c8ed1cb46c7de98a5a0287a1b83c2e006fbf5af3))

### Features

- Accept a null feature type, as @gmod/gff-nostream emits ([114266e](https://github.com/GMOD/g2p_mapper/commit/114266e7ff54396996e6fe16bfe3efe1c5f37634))

## [2.1.7](https://github.com/GMOD/g2p_mapper/compare/v2.1.6...v2.1.7) (2026-08-10)

### Chores

- Add git-cliff for changelog generation
- Type-check the tests and enforce prettier, as @gmod/bam does
- Let npm publish stop auto-correcting repository.url
- Exempt our own packages from the release quarantine
- Bump pnpm/action-setup to v6.0.10
- Gate preversion on format:check, as CI does
- Converge package.json on the shape its siblings use

### Documentation

- Mark breaking changes in the generated changelog

### Other Changes

- Revert "chore: converge package.json" — the CHANGELOG prettier step ([4c25e4b](https://github.com/GMOD/g2p_mapper/commit/4c25e4b308f22fbaba8b90f1f57f4b2e48cfd58f))

