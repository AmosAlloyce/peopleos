# Readable systems

The portfolio, PeopleOS, and FinPulse share an emphasis on clear information and visible decisions. The typography revision retains the existing DM Sans and Instrument Serif pairing while increasing the size of everyday text and controls.

## Figma work

[Alloyce Amos — Readable Systems](https://www.figma.com/design/nLV1ERYhMlA8zazfGYpc9h?node-id=2-2) contains an editable design concept, created through Figma MCP. It includes a PeopleOS review workspace, a typography specification, a portfolio hero, and a FinPulse credit data direction.

The concept was composed from editable text, auto-layout containers, and reusable button instances. It is an original refinement of the reading hierarchy, not a screenshot of the unchanged website. Its rendered text was checked for the intended DM Sans and Instrument Serif families. The local review export is `output/figma-readability-concept.png`; generated review artifacts are not committed.

The Figma concept establishes hierarchy and spacing decisions. It is not a complete component library or an exact specification of every application screen.

## Implemented typography

| Role | Size and behavior |
| --- | --- |
| PeopleOS body and main descriptions | 16px, with comfortable line spacing |
| PeopleOS primary navigation and actions | 15px; primary interactive controls have a 44px minimum target |
| PeopleOS table cells | 15px; tables scroll within their panel on narrow screens |
| Supporting PeopleOS labels | Generally 13px; small decorative SVG map labels remain separate from the reading scale |
| Portfolio paragraphs | 18px desktop, 17px phone |
| Portfolio primary actions | 15px with a minimum 46px target |
| Display typography | Large DM Sans headings with Instrument Serif emphasis |

The refinement also darkens important supporting copy, allows headers and controls to wrap, expands the sidebar where space permits, and turns complex workflow groups into a single column on phones. The overview flow uses a two-column phone layout, and the country map stacks beneath its explanation on small screens. These changes avoid squeezing larger text into the old small containers.

## Two projects, separate purposes

PeopleOS keeps its forest, sage, and warm paper palette. Its architecture section describes the actual People, Data, Payroll, and Service orchestrators; proposed changes still require human review.

FinPulse uses cobalt, ink, and ivory. Its project feature explains source ingestion, validation and quarantine, and traceable aggregates across bronze, silver, and gold layers. The portfolio links to the separate FinPulse application at `/finpulse/` and its [source repository](https://github.com/AmosAlloyce/FinPulse).

Each project has a distinct video selection. The native dialog loads the selected project's video, poster, and captions on demand. Closing it with Escape or the close button returns focus to the opening control. The PeopleOS button remains **Watch the walkthrough**; the additional control is **Watch FinPulse walkthrough**.

## Review evidence and limits

The typography changes were reviewed locally at 1440, 768, 390, and 320px. Portfolio checks covered overflow, diagram controls, mobile navigation, reduced motion, dialog closing, and focus restoration. All seven PeopleOS routes were checked for horizontal overflow at 768, 390, and 320px; additional desktop and phone captures were visually inspected. Browser measurements confirmed 15px navigation/actions and 16px main descriptions.

After adding the FinPulse project feature, the portfolio checks passed again at those four widths. Separate checks confirmed FinPulse's dialog title, media URLs, captions URL, poster URL, destination, keyboard focus, and card layout. FinPulse media files were still being produced during that integration check, so it did not establish successful playback of the completed video. Media recording and playback verification are tracked separately in [NARRATION.md](NARRATION.md).

Review images are stored locally under `output/readability-review/` and `output/finpulse-portfolio-review/`. These checks are focused browser reviews, not a claim of a complete accessibility certification or cross-browser test matrix.
