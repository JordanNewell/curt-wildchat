# CONFORMANCE-1K — WildChat-1M bulk conformance artifact

**Level:** L3 BULK — proves the .curt format scales on a real corpus. This is a
conformance artifact, not a distribution dataset. Nothing here is uploaded,
published, or committed; the sample lives locally under `work/` and must stay
there.

## Provenance

| | |
|---|---|
| Source | [`allenai/WildChat-1M`](https://huggingface.co/datasets/allenai/WildChat-1M), parquet shard 0 (of 14), **first 1000 rows** (records 0–999 of 59,857 in shard) |
| Downloaded | 2026-11-01 |
| Converter | `curt-wildchat` @ commit `25c60ad369dd2fca5f2dac2e20c38e373b3483bc` (v1.0.1) |
| Format lib | `curt-format` 1.2.0 |
| Sample file | `work/sample-1k.jsonl` (1000 lines, sha256 `9436423515139cc63accaa239a0cd33235c99f6df2ffffac239c44552742a2ab`) |

No content from any conversation appears in this document. WildChat is
unfiltered real-user data; only aggregate statistics appear here.

## Results

| Metric | Value |
|---|---|
| Records parsed from JSONL | 1000 |
| Conversion failures (round-trip or mapping) | 0 |
| Conversion skipped (no id / empty conversation / unknown role-only) | 0 |
| `.curt` files written | **995** |
| Duplicate `conversation_hash` rows in source | 2 hashes (5-row group + 2-row group = 7 rows → 5 silently overwritten, last-wins; see Findings) |
| Independent `parseCurt` validation pass rate | **995 / 995 (100%)** |
| Parse failures on written files | 0 |
| Total messages across corpus | 5504 (2742 user, 2762 assistant) |
| Source JSONL size | 16,459,439 bytes |
| Total `.curt` output size | 18,531,502 bytes |
| **Envelope overhead ratio** | **1.126×** (+12.6%) |

## Interpretation

The format holds up on real-world data with zero exceptions: all 1000 records
converted, every written file re-parsed cleanly under an independent
`parseCurt` pass, and no record was dropped by the mapping (empty-conversation
and unknown-role paths never fired on this slice). The +12.6% envelope overhead
over raw JSONL is acceptable for a self-describing, per-conversation-file
format, and most of it is structural (one JSON envelope per conversation,
synthesized message ids, ISO→epoch timestamps round-tripping through the
serializer) rather than payload duplication — moderation payloads and headers,
the bulkiest source fields, are carried verbatim either way. The single
information loss observed was upstream of the converter: WildChat-1M shard 0
contains repeated rows under the same `conversation_hash` (7 rows collapsing to
2 distinct hashes), and the filename convention is keyed on the conversation
identity, so colliding records silently overwrite — a property to be aware of
for bulk ingestion of any corpus with non-unique ids.

## Findings (converter)

1. **Silent filename collision on duplicate ids.** Two `conversation_hash`
   values appear multiple times in the first 1000 shard rows (one 5×, one 2×),
   with *differing* row content between repeats. `curtFilename()` keys on
   conversation identity, so `writeFileSync` last-wins and 5 conversions are
   lost with no counter in the summary line. Suggested improvement: detect an
   existing output path and count/expose collisions in the run summary.
2. Minor API note for validators: `parseCurt(raw)` returns the
   `CurtConversation` itself (or `null`) — not an envelope wrapper. First-pass
   validation scripts that expect `doc.conversation` will false-negative.

## Reproduce

```sh
cd E:/dev/projects/curt-wildchat
mkdir -p work
curl -sL -o work/shard0.parquet \
  "https://huggingface.co/api/datasets/allenai/WildChat-1M/parquet/default/train/0.parquet"
python - <<'EOF'
import pyarrow.parquet as pq, json
f = pq.ParquetFile("work/shard0.parquet")
n = 0
with open("work/sample-1k.jsonl", "w", encoding="utf-8") as out:
    i = 0
    while n < 1000:
        for r in f.read_row_group(i).to_pylist():
            if n >= 1000: break
            out.write(json.dumps(r, ensure_ascii=False, default=str) + "\n"); n += 1
        i += 1
EOF
node dist/cli.js work/sample-1k.jsonl -o work/out-1k
node work/validate-out.mjs
```

## License

Converted content is ODC-BY (WildChat-1M); see ACCESS-AND-LICENSE.md. If these
files ever leave this machine, carry the ODC-BY §4.3 attribution notice from the
README — but the default for this artifact is: it does not leave.
