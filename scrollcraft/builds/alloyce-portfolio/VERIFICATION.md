# Portfolio review

Reviewed locally on 2 October 2026 at `http://127.0.0.1:5173/` using headless Brave through Playwright. The actual React page is authored in `src/Portfolio.jsx`, `src/PortfolioCraft.jsx`, and `src/portfolio-craft.css`. The unchanged Scroll Craft engine files are retained here for reproducibility; the React page uses an event-driven hook with cleanup instead of mounting the engine's permanent animation loop.

## Completed checks

The focused browser script at `output/scrollcraft-portfolio/check.mjs` passed at 1440×950, 768×950, 390×844, 360×640, and 320×740. Each automated context disabled native pointer lock and capture.

- Both genuine hero captures loaded with nonzero natural dimensions.
- No page overflow or horizontally clipped headings, paragraphs, or buttons.
- The hero project selector changed the foreground choice and carried that choice into the closing demo link.
- The four record inspection steps produced the actual invalid source, failed format check, valid proposed value, and clearly stated approval boundary. This is a local illustration, not a fabricated session result.
- Keyboard activation changed the closing project selection and its destination.
- PeopleOS and FinPulse video dialogs opened, closed with Escape, and returned focus to the opening button. Playback verification is performed separately by the media workflow.
- The relocated PeopleOS department selector remained operable.
- The reduced-motion pass retained the complete scene and stopped scroll displacement.
- No uncaught JavaScript errors were recorded.

A production build passed after the component and CSS were wired into the page. The final phone-control adjustment was then compiled by Vite and exercised in the passing browser rerun; the parent release process runs the final production build.

## Pixels inspected and findings

The contact sheet and full-size desktop and phone frames were opened and inspected. The opening, pointer response, intermediate scroll position, hero exit, proposal state, mobile audit state, and closing selection all contain complete, readable content. The project windows retain distinct depth and resolve into the first project without a pinned empty interval. The foreground choice is usable with buttons, so pointer movement is optional.

The first visual review found a mobile usability issue despite passing overflow checks: inspection buttons sat below the record plate, so changing a step could leave its evidence outside the viewport. The final revision places a compact four-step selector immediately before the plate on phones and tablets. The final five-width rerun passed, and `evidence/trace-phone.png` shows the corrected relationship.

One initial automation run timed out while waiting for network idle under concurrent local recording load. The completed run uses DOM readiness and explicit image checks. Initial contact-sheet artifacts are preserved with `-before` suffixes under `output/scrollcraft-portfolio/`; the final `result.json` and this report supersede them. A proposal screenshot taken during the 220ms reveal showed an incomplete wipe; the final settled screenshot waits for the transition to complete.

## Feeling-curve review

The visual assessment of the first pass was: curiosity at the desk, recognition in the PeopleOS evidence, clarity on desktop but distance on the phone record inspection, confidence in the second project, understanding in the architecture, and readiness at the chosen-project ending. “Distance” did not meet the intended clarity beat. Moving the phone controls beside their consequence addressed that specific mismatch. This is an authored visual assessment, not a claim that a human user study established emotional outcomes.

The record inspection remains the longest dedicated interaction and the principal explanatory change. The preceding project evidence is visually calmer. The close retains a real, selected destination rather than fading into an empty screen.

## Evidence and limits

- `evidence/sheet.png`: desktop and phone sequence, including reduced motion.
- `evidence/hero-phone.png`: complete phone opening.
- `evidence/trace-phone.png`: repaired mobile selector and audit boundary.
- `output/scrollcraft-portfolio/`: all individual frames, browser script, and machine-readable passing result.

No assets were generated or purchased. No fictitious statistics or work-history claims were introduced. This review covers a Chromium-compatible desktop browser and emulated phone viewports. It does not establish real-device iOS behavior, a complete accessibility certification, or final hosted playback. Deployment, refreshed recordings, and the final package review remain part of the parent release task.
