#!/usr/bin/env python3
"""Generate naturally paced narration with ElevenLabs Voice AI.

Generates broadcast-quality voiceover for PeopleOS using ElevenLabs API.
Produces WAV, MP3, chapter schedule JSON, and WebVTT captions.
"""

import argparse
import base64
import json
import os
import re
import subprocess
import time
import urllib.error
import urllib.request
import wave
from pathlib import Path

# Sarah - Mature, Reassuring, Confident (American, Female, Professional)
DEFAULT_VOICE_ID = "EXAVITQu4vr4xnSDxMaL"
DEFAULT_MODEL_ID = "eleven_multilingual_v2"


def load_key():
    key = os.environ.get("ELEVENLABS_API_KEY", "").strip()
    if not key:
        path = Path("eleven.txt")
        if path.exists():
            key = path.read_text().strip()
    if not key:
        env_path = Path(".env")
        if env_path.exists():
            for line in env_path.read_text().splitlines():
                if line.strip().startswith("ELEVENLABS_API_KEY="):
                    key = line.split("=", 1)[1].strip().strip('"').strip("'")
                    break
    if not key:
        raise ValueError("ELEVENLABS_API_KEY is not configured in eleven.txt, .env, or environment.")
    return key


def run_command(args):
    subprocess.run(args, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)


def get_audio_duration(path):
    output = subprocess.check_output([
        "ffprobe", "-v", "error", "-show_entries", "format=duration", "-of",
        "default=noprint_wrappers=1:nokey=1", str(path),
    ], text=True)
    return float(output.strip())


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
            lines.extend([
                str(cue),
                f"{timestamp(passage['start'])} --> {timestamp(passage['end'])}",
                passage["text"],
                ""
            ])
            cue += 1
    path.write_text("\n".join(lines), encoding="utf-8")


def save_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(value, indent=2) + "\n", encoding="utf-8")
    temporary.replace(path)


def synthesize_chapter(text, voice_id, model_id, api_key, cache_dir):
    import hashlib
    digest = hashlib.sha256(f"{voice_id}:{model_id}:{text}".encode("utf-8")).hexdigest()[:24]
    cached_mp3 = cache_dir / f"{digest}.mp3"
    cached_meta = cache_dir / f"{digest}.json"

    if cached_mp3.exists() and cached_meta.exists():
        data = json.loads(cached_meta.read_text(encoding="utf-8"))
        return cached_mp3, data

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/with-timestamps"
    payload = {
        "text": text,
        "model_id": model_id,
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.8,
            "style": 0.0,
            "use_speaker_boost": True
        }
    }
    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "xi-api-key": api_key,
            "Content-Type": "application/json",
            "User-Agent": "PeopleOS-Narration/2.0"
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(request, timeout=60) as resp:
            resp_data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        try:
            err_body = error.read().decode("utf-8")
            err_json = json.loads(err_body)
            msg = err_json.get("detail", {}).get("message") or err_json.get("message") or str(error)
        except Exception:
            msg = str(error)
        raise RuntimeError(f"ElevenLabs TTS request failed (HTTP {error.code}): {msg}") from None

    audio_bytes = base64.b64decode(resp_data["audio_base64"])
    cached_mp3.write_bytes(audio_bytes)

    meta = {
        "voice_id": voice_id,
        "model_id": model_id,
        "text": text,
        "alignment": resp_data.get("alignment", {}),
        "normalized_alignment": resp_data.get("normalized_alignment", {})
    }
    cached_meta.write_text(json.dumps(meta, indent=2), encoding="utf-8")
    return cached_mp3, meta


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("script", type=Path, help="Input script JSON")
    parser.add_argument("output", type=Path, help="Output prefix without extension")
    parser.add_argument("--voice-id", default=DEFAULT_VOICE_ID, help="ElevenLabs Voice ID")
    parser.add_argument("--voice-name", default="Sarah", help="ElevenLabs Voice Name")
    parser.add_argument("--model-id", default=DEFAULT_MODEL_ID, help="ElevenLabs Model ID")
    parser.add_argument("--leading-silence", type=float, default=0.5, help="Leading silence in seconds")
    parser.add_argument("--chapter-pause", type=float, default=0.32, help="Pause between chapters in seconds")
    parser.add_argument("--trailing-silence", type=float, default=1.0, help="Trailing silence in seconds")
    parser.add_argument("--dry-run", action="store_true", help="Print summary without calling API")
    args = parser.parse_args()

    source = json.loads(args.script.read_text(encoding="utf-8"))
    chapters = source.get("chapters", source.get("segments", []))
    if not chapters:
        raise ValueError("Script must contain at least one chapter.")

    total_chars = sum(len(c["text"]) for c in chapters)
    print(f"Loaded {len(chapters)} chapters, {total_chars} total characters.")
    print(f"Target Voice: {args.voice_name} ({args.voice_id}), Model: {args.model_id}")

    if args.dry_run:
        print("Dry run requested; stopping before API calls.")
        return

    api_key = load_key()
    output_dir = args.output.parent
    output_dir.mkdir(parents=True, exist_ok=True)
    cache_dir = output_dir / "cache"
    cache_dir.mkdir(parents=True, exist_ok=True)

    rate = 48000
    chapter_audio_clips = []

    print("\nSynthesizing chapters via ElevenLabs...")
    for i, ch in enumerate(chapters):
        text = ch["text"].strip()
        print(f"[{i + 1}/{len(chapters)}] '{ch.get('title', ch.get('id'))}' ({len(text)} chars)...", end="", flush=True)
        t0 = time.time()
        mp3_path, meta = synthesize_chapter(text, args.voice_id, args.model_id, api_key, cache_dir)

        # Convert MP3 to 48kHz mono 16-bit WAV
        wav_path = cache_dir / f"{mp3_path.stem}.wav"
        if not wav_path.exists():
            run_command([
                "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
                "-i", str(mp3_path),
                "-ar", str(rate), "-ac", "1", "-c:a", "pcm_s16le",
                str(wav_path)
            ])
        clip_dur = get_audio_duration(wav_path)
        chapter_audio_clips.append({
            "chapter": ch,
            "wav_path": wav_path,
            "duration": clip_dur,
            "meta": meta
        })
        print(f" done ({clip_dur:.2f}s, elapsed {time.time() - t0:.1f}s)")

    # Build unnormalized master WAV mix and timeline
    raw_mix = args.output.with_suffix(".unnormalized.wav")
    timeline = []
    cursor = args.leading_silence

    with wave.open(str(raw_mix), "wb") as dest:
        dest.setnchannels(1)
        dest.setsampwidth(2)
        dest.setframerate(rate)

        # Write leading silence
        dest.writeframes(b"\0\0" * round(args.leading_silence * rate))

        for i, clip in enumerate(chapter_audio_clips):
            ch = clip["chapter"]
            ch_start = cursor
            speech_dur = clip["duration"]

            with wave.open(str(clip["wav_path"]), "rb") as src:
                frames = src.readframes(src.getnframes())
            dest.writeframes(frames)

            passage_start = round(cursor, 3)
            cursor += speech_dur
            passage_end = round(cursor, 3)

            pause = args.chapter_pause if i < len(chapter_audio_clips) - 1 else args.trailing_silence
            dest.writeframes(b"\0\0" * round(pause * rate))
            cursor += pause

            ch_id = ch.get("id", f"chapter-{i + 1}")
            ch_title = ch.get("title", f"Chapter {i + 1}")

            timeline.append({
                "id": ch_id,
                "title": ch_title,
                "start": round(ch_start, 4),
                "duration": round(cursor - ch_start, 4),
                "end": round(cursor, 4),
                "text": ch["text"],
                "passages": [
                    {
                        "start": passage_start,
                        "end": passage_end,
                        "text": ch["text"]
                    }
                ]
            })

    # Normalize audio track using broadcast standard loudnorm
    final_wav = args.output.with_suffix(".wav")
    final_mp3 = args.output.with_suffix(".mp3")
    final_json = args.output.with_suffix(".json")
    final_vtt = args.output.with_suffix(".vtt")

    print("\nNormalizing audio with EBU R128 loudnorm filter...")
    run_command([
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
        "-i", str(raw_mix),
        "-af", "loudnorm=I=-16:TP=-1.5:LRA=9",
        "-ar", str(rate), "-ac", "1", "-c:a", "pcm_s16le",
        str(final_wav)
    ])

    run_command([
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
        "-i", str(final_wav),
        "-c:a", "libmp3lame", "-b:a", "128k",
        str(final_mp3)
    ])

    final_dur = round(get_audio_duration(final_wav), 4)

    report = {
        "provider": "ElevenLabs",
        "model": args.model_id,
        "voice": args.voice_name,
        "voice_id": args.voice_id,
        "syntheticVoice": True,
        "duration": final_dur,
        "leadingSilence": args.leading_silence,
        "totalCharacters": total_chars,
        "chapters": timeline,
        "segments": timeline
    }

    save_json(final_json, report)
    write_captions(final_vtt, timeline)

    print(f"\nSuccessfully generated ElevenLabs narration!")
    print(f"Total duration: {final_dur:.2f}s across {len(timeline)} chapters.")
    print(f"Audio files: {final_wav}, {final_mp3}")
    print(f"Schedule: {final_json}")
    print(f"Captions: {final_vtt}")


if __name__ == "__main__":
    main()
