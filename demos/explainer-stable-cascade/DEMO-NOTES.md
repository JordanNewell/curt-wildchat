# Demo: explainer-stable-cascade

- **Source:** allenai/WildChat-1M, conversation_hash `5e6c6ea042026ec251c563827f8fb05b` (model `gpt-4-1106-preview`, 2 messages)
- **Retrieved:** 2026-11-01, anonymously, via the HF datasets-server rows API (the dataset is ungated; see ../../ACCESS-AND-LICENSE.md)
- **License basis for staging:** ODC-BY. WildChat-1M is distributed under the
  ODC Attribution License, which permits extraction and public conveying with
  attribution. Required notice (ODC-BY §4.3):

  > Contains information from WildChat-1M which is made available under the
  > ODC Attribution License. (https://huggingface.co/datasets/allenai/WildChat-1M)

- **Selection basis:** Learning/explainer: "explain the difference between
  Stable Cascade and Stable Diffusion without getting TOO technical." A
  small time-capsule: asked within days of Stable Cascade's announcement,
  the model honestly says the term isn't in its knowledge — a tidy demo of
  both plain-language explaining and model-knowledge limits.
- **Content rating:** reviewed manually before staging — SFW, non-toxic;
  `openai_moderation` all `flagged: false` with every category false;
  `detoxify_moderation` scores all < 0.01; record `toxic`/`redacted` false;
  language `English`.
- **Privacy scrub (publisher-side, not converter behavior):** `hashedIp`,
  `header`, `country`, and `state` removed from the conversation and every
  message after conversion. Message content is unmodified.
- **Converted with:** curt-wildchat@1.0.0; output re-parsed with `parseCurt`
  post-scrub.
