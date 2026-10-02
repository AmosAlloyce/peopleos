# Narration production

Current release: PeopleOS uses the later ElevenLabs Sarah narration described below (112.21 seconds). FinPulse uses the completed Groq Orpheus Troy narration (113.22 seconds). Both are disclosed as AI-generated voices. The Groq PeopleOS measurements below document the earlier recording; the active `peopleos-neural` files now contain the ElevenLabs version. The recorder and media check read the active timing JSON rather than assuming the older durations.

The current PeopleOS voiceover uses **ElevenLabs Sarah**, with a measured duration of **112.2136 seconds**. FinPulse uses **Groq Orpheus Troy**, at **113.2187 seconds**. Both recordings follow natural speech timing. The earlier Flite and PeopleOS Orpheus recordings remain historical artifacts; do not overwrite the current PeopleOS audio when reproducing an earlier provider experiment.

## Skill discovery and use

The official [OpenAI speech skill](https://github.com/openai/skills/tree/main/skills/.curated/speech) was discovered with the skill-installer catalogue and installed at `/home/alloyce/.codex/skills/speech`. Its product-demo and prompting guidance informed the delivery: composed, helpful, steady speech; complete sentences; clear acronyms; restrained emphasis; and explicit disclosure of synthetic narration.

The skill's bundled `text_to_speech.py` runner uses OpenAI's API and requires `OPENAI_API_KEY`. No OpenAI key was provided, and that runner has not been used for these recordings. `scripts/generate-neural-narration.py` is a separate project adapter for the already configured Groq account, not an unchanged execution of the OpenAI skill. The original bundled skill files are unmodified.

## Groq access

Groq lists `canopylabs/orpheus-v1-english` in the existing account's model catalogue. The first speech preview was rejected with HTTP 400 and `model_terms_required`; no speech was produced. After the account owner explicitly confirmed that Orpheus English was enabled, official speech requests succeeded. The initial neural versions used the built-in **Troy** voice; PeopleOS was subsequently upgraded to Sarah as described below. Model visibility alone does not prove that its terms have been accepted.

The account owner can open [Orpheus in Groq Playground](https://console.groq.com/playground?model=canopylabs%2Forpheus-v1-english), sign into the organization/project associated with the configured key, and review the model terms shown there. Proceed only if the owner accepts them. That URL is the **Try it in Playground** link on the [official model card](https://console.groq.com/docs/model/canopylabs/orpheus-v1-english). No automated process accepts terms or retries around this gate.

Model permissions are separate. If a later request returns a permission error, Groq documents organization permissions under **Settings → Organization → Limits** and project permissions under **Settings → Projects → Limits**. The initial failure was a terms error, not a permissions error. [Official permissions guide](https://console.groq.com/docs/model-permissions)

The adapter reads `GROQ_API_KEY` from the process environment or the local `.env`. It never prints the key, exports it into narration metadata, or sends employee records. Only the scripted narration is submitted to the official speech endpoint.

## Cost boundary

Groq publishes a price of **$22 per million input characters** for English Orpheus. The project limits the combined estimate for previews plus the PeopleOS and FinPulse narrations to **$0.25**, without creating an account, subscription, or paid upgrade. All runs share `output/speech/usage.json`; requests are reserved against the cap before being sent, including failed or uncertain requests. This is a conservative local estimate, not a provider invoice or account-wide spending control. [Orpheus documentation](https://console.groq.com/docs/text-to-speech/orpheus)

The PeopleOS script contains 1,749 characters, approximately **$0.0385** for a fresh complete run at that rate. FinPulse contains 1,760 characters, approximately **$0.0387**. Together with the rejected 171-character preview, the conservative combined estimate is **$0.0810**. Cached passages are reused. Keep the ledger intact across both demos; the estimate is derived from the published rate, not a billing receipt.

That ledger covers the Groq synthesis work only. It does not estimate the separate ElevenLabs production run, whose billing is not recorded in this ledger.

## Delivery and timing

- Use one built-in synthetic voice consistently; no personal voice is cloned.
- Write conversational, complete sentences and let the neural model supply their intonation.
- Keep provider requests within the documented 200-character limit, splitting only at sentence boundaries.
- Preserve the generated pace. Do not stretch speech into fixed nine-second slots.
- Retain internal pauses and breaths; trim only excess leading/trailing silence.
- Use a short transition between chapters and normalize the complete track once.
- Export actual chapter start/end times and captions, then record the interface to those times.

`docs/peopleos-neural-script.json` and `docs/finpulse-neural-script.json` each define ten semantic chapters. The output JSON contains `chapters` and a compatible `segments` alias, each with `id`, `title`, `start`, `end`, `duration`, text, and utterance boundaries. The first chapter begins after a short opening pause; the final chapter includes the closing pause. WAV is used for editing, MP3 for listening, and WebVTT for captions.

```sh
python3 scripts/generate-neural-narration.py \
  docs/peopleos-neural-script.json output/speech/peopleos-orpheus --dry-run
```

Omit `--dry-run` only when a new Orpheus synthesis is actually needed. Run the FinPulse demo with `docs/finpulse-neural-script.json output/speech/finpulse-neural`, retaining the same budget ledger. The current PeopleOS recording consumes the existing ElevenLabs files at `output/speech/peopleos-neural`; ordinary video re-recording requires no synthesis. Generated outputs remain under ignored `output/speech/` until the recorded video and final captions are explicitly updated.

The historical Orpheus tracks measured **118.0377 seconds for PeopleOS** and **113.2187 seconds for FinPulse**. The current recording prefixes below have `.wav`, `.mp3`, `.json`, and `.vtt` outputs; PeopleOS now contains the shorter ElevenLabs version:

- `output/speech/peopleos-neural`
- `output/speech/finpulse-neural`

The table below records the original Orpheus chapter starts, in seconds. For current capture, the recorder reads the provider's actual JSON schedule; it never uses this historical table. Within a chapter, actions use a fraction of that chapter's duration so the interface follows the speaker's pace.

| Chapter | Earlier PeopleOS Orpheus start | FinPulse start |
| --- | ---: | ---: |
| Introduction | 0.5000 | 0.5000 |
| Overview | 13.5542 | 12.1870 |
| Exceptions / event explorer | 26.7720 | 21.9895 |
| CSV preview / invalid batch | 35.4788 | 32.0323 |
| Agent studio / pipeline | 48.4550 | 42.3830 |
| Execution evidence / quality | 60.1909 | 55.0394 |
| Approval / replay | 72.9323 | 66.5793 |
| Service desk / market insights | 83.0200 | 77.5303 |
| Copilot / product catalogue | 94.0227 | 90.0008 |
| Audit trail / closing | 106.2649 | 100.8422 |

To record PeopleOS with its current fonts and measured audio timeline:

```sh
BASE_URL=http://127.0.0.1:5173 \
BROWSER_PATH=/opt/brave.com/brave/brave \
PLAYWRIGHT_BROWSERS_PATH=/home/alloyce/wave/output/browsers \
node scripts/record-demo.mjs

BASE_URL=http://127.0.0.1:5173 \
BROWSER_PATH=/opt/brave.com/brave/brave \
node scripts/check-media.mjs
```

Start the app and Vite server first. The recorder requires the completed neural narration; it does not silently regenerate speech or fall back to the old voice. It captures actual interactions, muxes audio and captions, and refreshes the workspace screenshot and video poster. The media check compares playback duration and every caption boundary against the generated schedule, then verifies seeking and HTTP byte ranges.

The earlier Orpheus PeopleOS recording passed that browser check: playback, seeking, all ten caption texts and boundaries, and HTTP 206 byte-range responses. That historical file was 118.040 seconds at 1440 × 1000, with mono AAC at 48 kHz and embedded English subtitles. Both original Orpheus WAVs had no detected silence of 1.2 seconds or longer and peaked near −1.5 dBFS. These are mechanical checks, not an audible quality assessment; the subsequent ElevenLabs recording has its own duration and verification below.

## Offline neural alternative

[Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M) is a local neural speech model. Its model card specifies Apache-2.0, and the [kokoro-onnx runner](https://github.com/thewh1teagle/kokoro-onnx) uses MIT licensing. The runner publishes downloadable model/voice files and supports CPU inference; no hosted speech account is required. Dependencies and model files belong in an isolated local environment, not in the application image or public repository.

The model author's [voice guide](https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md) warns that very short and very long utterances can reduce quality. Grouping coherent sentences and avoiding artificial time stretching is therefore useful for this option too. An isolated CPU preview was generated during the access investigation. The local model is optional, was not used in either published recording, and is not shipped with the web app.

## ElevenLabs Voice AI production

The demo narration was upgraded using ElevenLabs Voice AI (`eleven_multilingual_v2`) with the **Sarah** voice (`EXAVITQu4vr4xnSDxMaL` — mature, reassuring, and confident professional delivery).

- Generated via `scripts/generate-elevenlabs-narration.py docs/peopleos-neural-script.json output/speech/peopleos-elevenlabs`.
- Uses ElevenLabs `with-timestamps` API for precise millisecond alignment.
- Normalization: EBU R128 `loudnorm=I=-16:TP=-1.5:LRA=9` filter at 48 kHz mono PCM / AAC.
- Total narration duration: **112.21 seconds** across 10 semantic chapters.
- Video: Re-recorded live in Brave via Playwright (`scripts/record-demo.mjs`) to synchronize all interactions, tab navigation, CSV validation, agent workflows, human approvals, and copilot responses directly to Sarah's speech cadence.
- Verified with `scripts/check-media.mjs`: video decoding, seeking, all 10 caption cues aligned within 2ms, and HTTP 206 byte-range responses.
- Deployed directly to the Oracle production server (`https://alloyce-amos.duckdns.org/demo/peopleos-demo.mp4`).

The final portfolio hero was subsequently recaptured using that same Sarah WAV, without additional speech generation. The current local MP4 is **112.213 seconds**, **9,853,413 bytes**, with H.264 video at 1440 × 1000, mono AAC at 48 kHz, and embedded subtitles. All ten recorded interaction chapters and the browser media checks pass. Capture and verification logs are in `output/recording/peopleos-record-20261002.log` and `output/recording/peopleos-media-check-20261002.log`; the opening frame was visually reviewed against the final hero. The narration WAV remains SHA256 `2e2a70aa77ecc0a1465dff161624306b59fee5770dfdf2aca03cc2fb9e8564c7`.

## Review before publishing

Listen for product/name pronunciation, abrupt joins, clipped consonants, inconsistent volume, and long unexplained gaps. Check the technical claims against the recorded interface. Confirm the WAV duration, chapter ordering, caption timing, and final video synchronization. Retain the AI-generated voice disclosure. A valid audio file or passing transcript comparison alone does not establish a natural-sounding delivery.

The current tool environment can inspect audio files and measure their timing and levels, but does not support audible playback to the assistant. The recording work therefore includes file, waveform, caption, and browser checks; it does not claim a subjective listening review. The MP3 previews and final tracks are available for that review.
