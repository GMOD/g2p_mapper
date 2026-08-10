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

- Revert "chore: converge package.json" — the CHANGELOG prettier step

Removes `prettier --write CHANGELOG.md` from the `version` script, which the
previous commit added on a premise I did not check.

The reasoning was: git-cliff writes CHANGELOG.md after `preversion` has run, so
the format:check gate structurally cannot see it, while CI checks it on the tag
commit -- a hole the gate cannot cover. The first half is true. The second is
not: **every one of the 20 repos already lists CHANGELOG.md in
.prettierignore**, so CI's format:check skips it too and there was never a hole.

The step was also a no-op, verified rather than assumed: prettier skips an
ignored file even when it is named explicitly on the command line, so a
deliberately mangled CHANGELOG.md came back unchanged.

hclust was the only repo that had this step, which is where I copied it from.
It is reverted there too. The .prettierignore comments in bgzf-filehandle,
cram-js and hclust say why nobody should add it back: reformatting a generated
changelog fights the generator on every release.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>

