# Verification — 24 September 2026

The acceptance checks in the table below used fictional records and local services. Subsequent public Oracle deployment checks are recorded in [LIVE_DEPLOYMENT.md](LIVE_DEPLOYMENT.md). No production HRIS or real payroll system was accessed.

| Check | Result |
| --- | --- |
| Backend/API suite | 26 tests passed: validations, all four workflows, approvals, stale proposals, session isolation, CSV handling, provider limits, persistence and failure rollback |
| HR browser acceptance | Passed seven sections, all four workflows, record inspection, CSV preview, approval/rejection, ticket creation, English/French copilot, search, export and visitor isolation |
| HR responsive layouts | Passed 1440, 1024, 768, 390 and 320 px widths, including navigation and horizontally scrollable tables |
| Portfolio browser review | Passed desktop/tablet/mobile layouts, interactive diagram, keyboard dialog dismissal, focus restoration, mobile navigation and reduced motion |
| Recorded walkthrough | Actual browser interactions; 90 seconds, 1440 × 1000, H.264 video, AAC synthetic narration, ten caption cues |
| Embedded playback | Decodes and plays; seeking, all ten caption cues and HTTP byte-range responses verified |
| Docker runtime | Portfolio and deep links, API workflow, exact MP4 hash, CSV export/import preview and approval passed under non-root, read-only filesystem and 384 MB app memory configuration |
| Docker persistence | Approved session restored after a real container restart; repeated approval returned 409 |
| n8n export | JSON, graph, Code-node JavaScript and actual cookie-preserving HTTP sequence validated; native import into an n8n instance remains untested |

The browser checks used the installed Brave Chromium executable. Microphone capture and installed speech voices depend on the user's browser/device; automated checks cover the text conversation and language selection, not acoustic recognition accuracy. Live Groq calls require an account key; provider behavior was tested using controlled response/failure fixtures, and the recorded demo uses deterministic responses.

The recording reflects the working demo at capture time. Subsequent overview wording clarifies the cleared-exception state; the recorded data, actions and outcomes are unchanged.

Reproduce using the commands in [README](../README.md), [browser acceptance](../scripts/browser-test.mjs), [portfolio checks](../scripts/portfolio-test.mjs), and [media checks](../scripts/check-media.mjs). Public HTTPS, DNS and actual Groq response verification passed after deployment; [live API verification](../scripts/verify-live.mjs) can reproduce the public API checks using isolated fictional sessions.
