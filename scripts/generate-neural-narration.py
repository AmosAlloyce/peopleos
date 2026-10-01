#!/usr/bin/env python3
"""Generate naturally paced narration with Groq Orpheus or local Kokoro.

Unlike the offline legacy generator, this preserves the speaker's actual pace.
It outputs WAV, MP3, a chapter timeline, and WebVTT captions. Record the video to
the generated timeline; no sentence is stretched into a fixed nine-second slot.

Usage:
  python3 scripts/generate-neural-narration.py docs/peopleos-neural-script.json output/speech/peopleos
  python3 scripts/generate-neural-narration.py INPUT OUTPUT --dry-run
  /tmp/peopleos-neural-venv/bin/python scripts/generate-neural-narration.py INPUT OUTPUT --engine kokoro

Uses GROQ_API_KEY from the process or local .env. Never prints credentials.
Only the narration text is sent to https://api.groq.com/openai/v1/audio/speech.
"""

import argparse
import hashlib
import json
import os
import re
import subprocess
import time
import urllib.error
import urllib.request
import wave
from pathlib import Path


MODEL = "canopylabs/orpheus-v1-english"
RATE_USD_PER_MILLION_CHARACTERS = 22.0
INPUT_LIMIT = 200
MAX_TOTAL_ESTIMATE_USD = 0.25
LEDGER_DEFAULT = Path("output/speech/usage.json")


def load_key():
    key = os.environ.get("GROQ_API_KEY", "").strip()
    if not key:
        path = Path(".env")
        if path.exists():
            for line in path.read_text().splitlines():
                if line.strip().startswith("GROQ_API_KEY="):
                    key = line.split("=", 1)[1].strip().strip('"').strip("'")
                    break
    if not key:
        raise ValueError("GROQ_API_KEY is not configured in the environment or local .env")
    return key


def command(args):
    subprocess.run(args, check=True, stdout=subprocess.DEVNULL)


def duration(path):
    output = subprocess.check_output([
        "ffprobe", "-v", "error", "-show_entries", "format=duration", "-of",
        "default=noprint_wrappers=1:nokey=1", str(path),
    ], text=True)
    return float(output.strip())


def split_passage(text):
    """Keep full sentences together up to the provider's current input limit."""
    text = re.sub(r"\s+", " ", text).strip()
    sentences = re.split(r"(?<=[.!?])\s+", text)
    chunks = []
    pending = ""
    for sentence in sentences:
        if len(sentence) > INPUT_LIMIT:
            raise ValueError("A sentence exceeds 200 characters. Shorten it or add a natural sentence boundary.")
        candidate = (pending + " " + sentence).strip()
        if len(candidate) <= INPUT_LIMIT:
            pending = candidate
        else:
            chunks.append(pending)
            pending = sentence
    if pending:
        chunks.append(pending)
    return chunks


def save_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(value, indent=2) + "\n")
    temporary.replace(path)


def fetch_speech(text, voice, target, key, ledger_path, ledger):
    estimate = len(text) * RATE_USD_PER_MILLION_CHARACTERS / 1_000_000
    if ledger["estimatedUpperBoundUsd"] + estimate > MAX_TOTAL_ESTIMATE_USD:
        raise ValueError("The shared $0.25 synthesis estimate cap would be exceeded; no request sent")
    # Reserve before the request: even uncertain/failed requests count against the cap.
    ledger["estimatedUpperBoundUsd"] += estimate
    ledger["requests"].append({
        "model": MODEL, "voice": voice, "characters": len(text),
        "estimatedUsd": estimate, "target": str(target), "status": "reserved",
    })
    save_json(ledger_path, ledger)
    payload = json.dumps({"model": MODEL, "voice": voice, "input": text,
                          "response_format": "wav"}).encode()
    request = urllib.request.Request(
        "https://api.groq.com/openai/v1/audio/speech", data=payload,
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json",
                 "User-Agent": "PeopleOS-narration/2.0"}, method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            body = response.read(15 * 1024 * 1024 + 1)
            if len(body) > 15 * 1024 * 1024 or not body.startswith(b"RIFF"):
                raise ValueError("Speech provider returned unexpected audio; response was not saved")
            target.write_bytes(body)
        ledger["requests"][-1]["status"] = "completed"
    except urllib.error.HTTPError as error:
        ledger["requests"][-1]["status"] = f"HTTP {error.code}"
        # Read only documented error type/code, never echo request headers or keys.
        try:
            detail = json.loads(error.read()).get("error", {})
            code = detail.get("code") or detail.get("type") or "unknown"
        except Exception:
            code = "unknown"
        raise RuntimeError(f"Official Groq speech request failed: HTTP {error.code}, code {code}. No automatic retry.") from None
    finally:
        save_json(ledger_path, ledger)


def timestamp(seconds):
    value = round(seconds * 1000)
    hour, value = divmod(value, 3_600_000)
    minute, value = divmod(value, 60_000)
    second, millisecond = divmod(value, 1000)
    return f"{hour:02}:{minute:02}:{second:02}.{millisecond:03}"


def write_captions(path, timeline):
    lines = ["WEBVTT", "", "NOTE", "AI-generated narration. Synthetic demonstration data.", ""]
    cue = 1
    for chapter in timeline:
        for passage in chapter["passages"]:
            # Caption boundaries align to actual generated utterances.
            lines.extend([str(cue), f"{timestamp(passage['start'])} --> {timestamp(passage['end'])}",
                          passage["text"], ""])
            cue += 1
    path.write_text("\n".join(lines))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("script", type=Path)
    parser.add_argument("output", type=Path, help="Output prefix, without extension")
    parser.add_argument("--engine", choices=["groq", "kokoro"], default="groq")
    parser.add_argument("--voice", help="Built-in voice: troy for Groq, af_heart for local Kokoro by default")
    parser.add_argument("--model-path", type=Path, default=Path("/tmp/peopleos-neural-models/kokoro-v1.0.fp16.onnx"))
    parser.add_argument("--voices-path", type=Path, default=Path("/tmp/peopleos-neural-models/voices-v1.0.bin"))
    parser.add_argument("--speed", type=float, default=1.0, help="Native model speed for local Kokoro only")
    parser.add_argument("--ledger", type=Path, default=LEDGER_DEFAULT)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--chapter-pause", type=float, default=0.32)
    parser.add_argument("--leading-silence", type=float, default=0.5)
    parser.add_argument("--trailing-silence", type=float, default=1.0)
    args = parser.parse_args()
    args.voice = args.voice or ("troy" if args.engine == "groq" else "af_heart")
    if args.engine == "groq" and args.voice not in ["autumn", "diana", "hannah", "austin", "daniel", "troy"]:
        raise ValueError("Choose one of Groq's documented built-in English voices")
    source = json.loads(args.script.read_text())
    chapters = source.get("chapters", source.get("segments", []))
    if not chapters:
        raise ValueError("Provide at least one chapter with text")
    passages = [(i, part) for i, chapter in enumerate(chapters) for part in split_passage(chapter["text"])]
    characters = sum(len(text) for _, text in passages)
    estimated = characters * RATE_USD_PER_MILLION_CHARACTERS / 1_000_000 if args.engine == "groq" else 0.0
    print(f"{len(chapters)} chapters, {len(passages)} passages, {characters} characters; provider estimate ${estimated:.4f} ({args.engine}).", flush=True)
    if args.dry_run:
        return
    key = load_key() if args.engine == "groq" else None
    local_model = None
    model_id = MODEL if args.engine == "groq" else "hexgrad/Kokoro-82M-v1.0-fp16"
    if args.engine == "kokoro":
        # Keep CPU-only inference modest on the shared development machine.
        if hasattr(os, "sched_getaffinity"):
            available = sorted(os.sched_getaffinity(0))
            os.sched_setaffinity(0, available[:2])
        import onnxruntime
        onnxruntime.disable_telemetry_events()
        onnxruntime.set_default_logger_severity(3)
        from kokoro_onnx import Kokoro
        import soundfile
        local_model = Kokoro(str(args.model_path), str(args.voices_path))
        if args.voice not in local_model.get_voices():
            raise ValueError("The requested built-in voice is absent from the local voice bundle")
    args.output.parent.mkdir(parents=True, exist_ok=True)
    cache = args.output.parent / "cache"
    cache.mkdir(exist_ok=True)
    ledger = json.loads(args.ledger.read_text()) if args.ledger.exists() else {
        "provider": "Groq official speech API", "publishedUsdPerMillionCharacters": RATE_USD_PER_MILLION_CHARACTERS,
        "estimatedUpperBoundUsd": 0.0, "capUsd": MAX_TOTAL_ESTIMATE_USD, "requests": [],
    }
    chapter_audio = [[] for _ in chapters]
    last_request = 0.0
    for chapter_index, text in passages:
        digest = hashlib.sha256(json.dumps([model_id, args.voice, args.speed, text]).encode()).hexdigest()[:20]
        raw = cache / f"{digest}.wav"
        clean = cache / f"{digest}-clean.wav"
        if not raw.exists():
            if args.engine == "groq":
                # Groq's published free tier permits 10 requests/minute. Stay below it.
                delay = max(0, 6.3 - (time.monotonic() - last_request))
                if delay:
                    time.sleep(delay)
                fetch_speech(text, args.voice, raw, key, args.ledger, ledger)
                last_request = time.monotonic()
            else:
                samples, sample_rate = local_model.create(text, voice=args.voice, speed=args.speed, lang="en-us", trim=False)
                soundfile.write(str(raw), samples, sample_rate, subtype="PCM_16")
        if not clean.exists():
            # Trim only leading/trailing silence, preserve interior phrasing and breath.
            command(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(raw),
                     "-af", "silenceremove=start_periods=1:start_duration=0.05:start_threshold=-48dB:start_silence=0.06,areverse,silenceremove=start_periods=1:start_duration=0.08:start_threshold=-48dB:start_silence=0.12,areverse,afade=t=in:d=0.006",
                     "-ar", "48000", "-ac", "1", "-c:a", "pcm_s16le", str(clean)])
        chapter_audio[chapter_index].append({"text": text, "path": clean, "duration": duration(clean)})
        print(f"Chapter {chapter_index + 1}: {chapter_audio[chapter_index][-1]['duration']:.2f}s of natural speech.", flush=True)

    # Concatenate PCM and short pauses directly: no per-chapter time stretching,
    # rigid grid, chopped breaths, or multiple loudness-normalization passes.
    raw_mix = args.output.with_suffix(".unnormalized.wav")
    rate = 48000
    timeline = []
    cursor = args.leading_silence
    with wave.open(str(raw_mix), "wb") as dest:
        dest.setnchannels(1)
        dest.setsampwidth(2)
        dest.setframerate(rate)
        dest.writeframes(b"\0\0" * round(args.leading_silence * rate))
        for i, (chapter, clips) in enumerate(zip(chapters, chapter_audio)):
            start = cursor
            recorded = []
            for j, clip in enumerate(clips):
                with wave.open(str(clip["path"]), "rb") as src:
                    frames = src.readframes(src.getnframes())
                    speech_duration = len(frames) / (rate * 2)
                dest.writeframes(frames)
                recorded.append({"start": round(cursor, 4), "end": round(cursor + speech_duration, 4), "text": clip["text"]})
                cursor += speech_duration
                if j < len(clips) - 1:
                    dest.writeframes(b"\0\0" * round(0.16 * rate))
                    cursor += 0.16
            pause = args.chapter_pause if i < len(chapters) - 1 else args.trailing_silence
            dest.writeframes(b"\0\0" * round(pause * rate))
            cursor += pause
            timeline.append({"id": chapter.get("id", f"chapter-{i + 1}"), "title": chapter.get("title", f"Chapter {i + 1}"),
                             "start": round(start, 4), "duration": round(cursor - start, 4), "end": round(cursor, 4),
                             "text": chapter["text"], "passages": recorded})
    final = args.output.with_suffix(".wav")
    command(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(raw_mix),
             "-af", "loudnorm=I=-16:TP=-1.5:LRA=9", "-ar", "48000", "-ac", "1", "-c:a", "pcm_s16le", str(final)])
    command(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(final),
             "-c:a", "libmp3lame", "-b:a", "128k", str(args.output.with_suffix(".mp3"))])
    report = {"provider": "Groq" if args.engine == "groq" else "Local Kokoro ONNX", "model": model_id, "voice": args.voice, "syntheticVoice": True,
              "duration": round(duration(final), 4), "leadingSilence": args.leading_silence,
              "estimatedNewNarrationUsd": round(estimated, 6), "sharedEstimatedUpperBoundUsd": round(ledger["estimatedUpperBoundUsd"], 6),
              "chapters": timeline, "segments": timeline}
    save_json(args.output.with_suffix(".json"), report)
    write_captions(args.output.with_suffix(".vtt"), timeline)
    print(f"Created {final}: {report['duration']:.2f}s. Shared spend estimate: ${ledger['estimatedUpperBoundUsd']:.4f}/${MAX_TOTAL_ESTIMATE_USD:.2f}.")


if __name__ == "__main__":
    main()
