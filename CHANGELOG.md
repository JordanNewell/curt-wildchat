# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
