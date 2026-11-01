# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.2] - 2026-11-01

### Fixed

- Filename collisions are no longer silently overwritten. `curtFilename()`
  keys on conversation identity, and real WildChat data contains duplicate
  `conversation_hash` values with diverging rows — on the 1K conformance
  sample this swallowed 5 of 1000 conversions (last-wins). Identical
  content now overwrites in place (idempotent re-runs); differing content
  gets a `-N` suffix, a per-collision stderr line, and a count in the CLI
  summary.

### Added

- `resolveCurtWritePath()` library function + 4 tests.
- `CONFORMANCE-1K.md`: L3 BULK conformance artifact — 1000 real WildChat
  records, 995/995 output files re-validate with `parseCurt`, 1.126x
  envelope overhead (pre-fix file count; see the doc for provenance).

### Changed

- `GENERATOR` string aligned with the package version (was pinned at
  1.0.0 since release).

## [1.0.0] - initial public release (unreleased)

### Added

- WildChat-1M (HuggingFace `allenai/WildChat-1M`) to .curt converter, with
  CLI (`-o/--out`, `--sample N`, `--language X`, `--stdout`) and a library
  API (`convertWildchat`, `serializeValidated` — every output is re-parsed
  with `parseCurt` before it is written).
- `ACCESS-AND-LICENSE.md`: verified access record (dataset is ungated,
  checked anonymously 2026-11-01) and the ODC-BY license analysis, including
  the §4.3 attribution-notice requirement for publicly conveyed Produced
  Works and the §2.4 contents-rights caveat.
- Three staged demo conversations under `demos/` (benign, SFW records;
  `hashedIp`/`header` metadata scrubbed post-conversion; attribution in each
  demo's `DEMO-NOTES.md`).

### Changed

- Version jumps from the internal 0.1.0 straight to 1.0.0 for the initial
  public release: the WildChat-1M schema mapping is verified against the
  live datasets-server schema (id field is `conversation_hash`), the suite
  is green (17 tests, synthetic fixtures only — no WildChat content in the
  package), and the CLI/API surface is considered stable.
