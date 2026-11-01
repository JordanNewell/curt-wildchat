# WildChat-1M: access path and license (verified 2026-11-01)

Everything below was checked live, anonymously (no HF account, no token),
via the HF API and datasets-server. This file is the decision record for
whether demo conversations may be staged/republished.

## Access: NOT gated

`GET https://huggingface.co/api/datasets/allenai/WildChat-1M` returns
`"gated": false`, `"private": false`. No account, token, or terms
acceptance is required for any access path tested:

- **Preview rows (used by this project):** datasets-server serves real rows
  anonymously —
  `https://datasets-server.huggingface.co/rows?dataset=allenai%2FWildChat-1M&config=default&split=train&offset=0&length=100`
  returned 200 with full conversation content (837,989 rows total).
- **Full download:** the repo's parquet files (`data/train-*.parquet`,
  14 shards, ~3.4 GB) are listed in the repo tree with no gate flag; the
  datasets-server `is-valid` endpoint reports viewer/search/filter all true.
- **Search:** `https://datasets-server.huggingface.co/search?dataset=allenai/WildChat-1M&...`
  is available for finding candidate conversations.

Note: the *original* 2023 `allenai/WildChat` release required the AI2
ImpAct license agreement. `WildChat-1M` (2024-05) is a separate, ungated
repo under ODC-BY. The ImpAct gate does not apply to WildChat-1M.

## Comparison fallbacks (both gated)

- `lmsys/lmsys-chat-1m` — `"gated": "auto"` with `extra_gated_fields`
  (Name, Email, Affiliation, Country) and an explicit click-through to the
  LMSYS-Chat-1M Dataset License Agreement. Not usable without an account +
  acceptance.
- `lmsys/chatbot_arena_conversations` — also `"gated": "auto"` with a
  disclaimers click-through and a no-deanonymization clause. Not usable
  anonymously.

WildChat-1M is the only one of the three that works with zero accounts.

## License: ODC Attribution License (ODC-BY)

Tagged `license:odc-by`; verbatim text at
https://huggingface.co/datasets/allenai/WildChat-1M/raw/main/LICENSE.md
(repo commit 7d6490e). Key clauses, quoted verbatim:

Rights granted (§3.1):

> the Licensor grants to You a worldwide, royalty-free, non-exclusive,
> terminable (but only under Section 9) license to Use the Database for the
> duration of any applicable copyright and Database Rights. These rights
> explicitly include commercial use, and do not exclude any field of
> endeavour.

Content vs Database (§2.4 — the important caveat):

> The individual items of the Contents contained in this Database may be
> covered by other rights, including copyright, patent, data protection,
> privacy, or personality rights, and this License does not cover any rights
> (other than Database Rights or in contract) in individual Contents
> contained in the Database.

Notice for Produced Works (§4.3 — what republishing demos requires):

> if you Publicly Use a Produced Work, You must include a notice associated
> with the Produced Work reasonably calculated to make any Person that uses,
> views, accesses, interacts with, or is otherwise exposed to the Produced
> Work aware that Content was obtained from the Database, Derivative
> Database, or the Database as part of a Collective Database, and that it
> is available under this License.

with the license's own example notice:

> Contains information from DATABASE NAME which is made available under the
> ODC Attribution License.

No-redistribution clause? **None.** ODC-BY permits redistribution of the
Database, Derivative Databases, and Produced Works, with attribution and
share-alike-by-notice only. There is no research-only restriction, no
non-commercial restriction, and no prohibition on excerpting individual
conversations (insubstantial-part extraction is explicitly fine, §6.2).

## Privacy caveat (separate from the license)

The dataset ships `hashed_ip`, `header.user-agent`, and coarse
state/country per conversation. ODC-BY does not clear privacy rights in the
Contents (§2.4, preamble: "privacy rights / data protection rights over
information in the contents"). AI2 applied PII redaction to content
(`redacted: true` records carry `[EMAIL_REDACTED]`-style markers), but the
metadata fields are still quasi-identifiers. Any staged demo strips
`hashed_ip` and `header` — the converter keeps them (faithful conversion is
the converter's job; scrubbing is the publisher's job, and is documented in
the README Security section).

## Bottom line

- Converter: can consume WildChat-1M data freely, locally or at scale.
- Demos: **staging real converted conversations is permitted** under ODC-BY,
  provided each staged file (or its accompanying notes) carries the §4.3
  attribution notice and links back to the dataset. Chosen approach:
  `demos/DEMO-NOTES.md` carries the notice verbatim per file.
- lmsys datasets are not viable anonymous fallbacks (both gated); not needed.
