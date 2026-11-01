# curt-wildchat

Convert WildChat conversation records (HuggingFace
[`allenai/WildChat-1M`](https://huggingface.co/datasets/allenai/WildChat-1M))
into [`.curt`](https://github.com/JordanNewell/dot_curt) single-file
conversation format. Built on [`curt-format`](https://www.npmjs.com/package/curt-format)
(reference implementation, v1 core). Sister to `curt-convert` (Claude Code
transcripts → .curt).

**What this is:** a bridge, not an endorsement. WildChat is research data —
real user conversations with ChatGPT, collected in the wild. .curt is a
file format. This converter moves records from the former into the latter;
it makes no claim that WildChat content is representative, safe, or
suitable for any particular use. Screen anything you plan to show anyone.

```sh
npm install -g curt-wildchat   # or: npx curt-wildchat
curt-wildchat wildchat.jsonl -o ./out
curt-wildchat wildchat.jsonl --sample 5
curt-wildchat wildchat.jsonl --language English
curt-wildchat wildchat.jsonl --stdout > one.curt
```

Input is JSONL, one WildChat record per line (HF exports parquet; the
datasets-server rows API or a parquet→JSONL export both work). Every
output is re-parsed with `parseCurt` before it is written; a file that
fails round-trip validation is never written. Output names follow the
Curtis bulk convention (`YYYY-MM-DD <slug> <suffix>.curt`) via
`curtFilename()`.

## Schema note

The WildChat-1M id field is **`conversation_hash`**, not `conversation_id`
(despite the task-shaped intuition; verified against the datasets-server
schema, 2026-11-01). Turn roles observed: `user`, `assistant`, `system`.

## Mapping

| WildChat-1M | .curt | Notes |
|---|---|---|
| `conversation_hash` | `conversation.id` | |
| — | `conversation.title` | First user text, single line, capped at 60 chars (no title exists in WildChat). |
| turn `timestamp` (else record `timestamp`) | message `timestamp` | User turns carry `timestamp: null`; they inherit the record timestamp. ISO 8601 → epoch ms. |
| min/max message `timestamp` | `conversation.createdAt` / `updatedAt` | 0 when nothing parseable. |
| record `model` | `conversation.model` + per-assistant-message `model` | WildChat's model is per-conversation; user turns get no model. |
| — | `conversation.provider` | Always `"openai"` (WildChat-1M is ChatGPT conversations). |
| turn `role` | message `role` | `user`/`assistant`/`system` map 1:1. Other roles are dropped and counted. |
| turn `content` | message `content` | |
| — | message `id` | Synthesized `"<conversation_hash>-<n>"` (n counts emitted messages). |
| record `language` / turn `language` | `conversation.language` / message `language` | Extra field; readers ignore unknowns. |
| turn `toxic`, `redacted` | message `toxic`, `redacted` | Extra fields, verbatim. |
| record `toxic`, `redacted` | `conversation.toxic`, `conversation.redacted` | Extra fields, verbatim. |
| record `country`, `state` | `conversation.country`, `conversation.state` | Extra fields (first user turn's demographics, verbatim). |
| record `hashed_ip`, `header` | `conversation.hashedIp`, `conversation.header` | Extra fields (camelCased key for the IP). See Security. |
| record `turn` | `conversation.turns` | Renamed: `turn` reads as one message in .curt contexts. |
| `openai_moderation`, `detoxify_moderation` | `conversation.openaiModeration`, `conversation.detoxifyModeration` | Per-turn moderation payloads, verbatim. |

## Documented losses

- Turn `turn_identifier` → message extra `turnIdentifier` (kept, but
  numbering differs from WildChat's when roles are dropped).
- Roles other than user/assistant/system are dropped (counted in stats).
  Empty-content turns are dropped (counted).
- WildChat has no conversation titles, message ids, or tool calls — the
  `tool-linkage` extension never applies here.
- Records with no id or an empty `conversation` array are rejected whole.
- Unparseable JSONL lines are counted, never fatal.
- Envelope-top-level extras beyond `curt`/`version`/`generator`/
  `conversation` are not carried from a *read* `.curt` file (this tool only
  writes). Unknown fields inside the conversation and its messages are
  preserved where possible by conforming readers, but preservation is not
  guaranteed normatively by the spec.

## License and attribution

- **This converter:** MIT (see `LICENSE`). The code contains no WildChat
  content; test fixtures are fully synthetic.
- **WildChat-1M data:** [ODC-BY](https://huggingface.co/datasets/allenai/WildChat-1M/blob/main/LICENSE.md)
  (license tag verified 2026-11-01; the repo is **not gated** — see
  `ACCESS-AND-LICENSE.md` for the full verified record). ODC-BY covers the
  *Database*; §2.4 explicitly does not clear rights (privacy, data
  protection) in the individual *Contents*. Conversion is an extraction;
  redistributing converted conversations is permitted with attribution.

If you publicly convey converted WildChat content, carry the ODC-BY §4.3
notice, e.g.:

> Contains information from WildChat-1M which is made available under the
> ODC Attribution License. (https://huggingface.co/datasets/allenai/WildChat-1M)

The staged files under `demos/` follow this via their `DEMO-NOTES.md`.

## Security

Converting is faithful: `hashed_ip`, `header.user-agent`, and coarse
location land in the output, and conversations flagged `toxic` are
converted like any other. Treat `.curt` output as record-equivalent —
scrub before sharing. The staged `demos/` files were hand-picked for
benign, SFW, non-toxic records and had `hashedIp`/`header` metadata
removed post-conversion (a deliberate publisher-side scrub, not a
converter behavior).

## Development

```sh
npm i
npm test       # vitest, 17 tests
npm run build  # tsc -> dist/
```

MIT — see [LICENSE](LICENSE).
