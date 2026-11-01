# Demo: math-bacteria-cup

- **Source:** allenai/WildChat-1M, conversation_hash `13d8cd9cd5e84c5b830c647e8cdcd54b` (model `gpt-3.5-turbo-0301`, 4 messages)
- **Retrieved:** 2026-11-01, anonymously, via the HF datasets-server rows API (the dataset is ungated; see ../../ACCESS-AND-LICENSE.md)
- **License basis for staging:** ODC-BY. WildChat-1M is distributed under the
  ODC Attribution License, which permits extraction and public conveying with
  attribution. Required notice (ODC-BY §4.3):

  > Contains information from WildChat-1M which is made available under the
  > ODC Attribution License. (https://huggingface.co/datasets/allenai/WildChat-1M)

- **Selection basis:** Math/reasoning: a classic exponential-growth puzzle
  (bacteria tripling hourly, when is the cup one-ninth full), answered by
  working backwards — followed by a second spatial-reasoning question in the
  same session. Short, clean reasoning demo from the early-gpt-3.5 era.
- **Content rating:** reviewed manually before staging — SFW, non-toxic;
  `openai_moderation` all `flagged: false` with every category false;
  `detoxify_moderation` scores all < 0.01; record `toxic`/`redacted` false;
  language `English`.
- **Privacy scrub (publisher-side, not converter behavior):** `hashedIp`,
  `header`, `country`, and `state` removed from the conversation and every
  message after conversion. Message content is unmodified.
- **Converted with:** curt-wildchat@1.0.0; output re-parsed with `parseCurt`
  post-scrub.
