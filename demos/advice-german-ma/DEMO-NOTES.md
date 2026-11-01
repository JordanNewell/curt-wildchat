# Demo: advice-german-ma

- **Source:** allenai/WildChat-1M, conversation_hash `c189d5ba191bd75276458b426baff316` (model `gpt-3.5-turbo-0613`, 4 messages)
- **Retrieved:** 2026-11-01, anonymously, via the HF datasets-server rows API (the dataset is ungated; see ../../ACCESS-AND-LICENSE.md)
- **License basis for staging:** ODC-BY. WildChat-1M is distributed under the
  ODC Attribution License, which permits extraction and public conveying with
  attribution. Required notice (ODC-BY §4.3):

  > Contains information from WildChat-1M which is made available under the
  > ODC Attribution License. (https://huggingface.co/datasets/allenai/WildChat-1M)

- **Selection basis:** Practical how-to: an international student with a
  Hungarian-taught BA asks for German universities offering a linguistics MA,
  then pivots to translation MA in a follow-up — a real, personal
  study-planning arc with concrete recommendations.
- **Content rating:** reviewed manually before staging — SFW, non-toxic;
  `openai_moderation` all `flagged: false` with every category false;
  `detoxify_moderation` scores all < 0.01; record `toxic`/`redacted` false;
  language `English`.
- **Privacy scrub (publisher-side, not converter behavior):** `hashedIp`,
  `header`, `country`, and `state` removed from the conversation and every
  message after conversion. Message content is unmodified.
- **Converted with:** curt-wildchat@1.0.0; output re-parsed with `parseCurt`
  post-scrub.
