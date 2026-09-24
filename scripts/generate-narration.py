#!/usr/bin/env python3
"""Create a timed, offline demo narration using FFmpeg's installed Flite voice.

Usage: python3 scripts/generate-narration.py segments.json output/narration.wav
Input: {"duration": 70, "segments": [{"start": 0, "duration": 7, "text": "..."}]}

Uses an ordinary synthetic voice. No network, credentials, or voice cloning.
FFmpeg must include the flite filter, and ffprobe must be installed.
"""

import argparse
import json
import subprocess
import tempfile
from pathlib import Path


def run(args):
    subprocess.run(args, check=True, stdout=subprocess.DEVNULL)


def probe_duration(path):
    result = subprocess.check_output([
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1", str(path),
    ], text=True)
    return float(result.strip())


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("schedule", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--voice", choices=["slt", "rms", "awb", "kal", "kal16"], default="slt")
    parser.add_argument("--max-speed", type=float, default=1.35,
                        help="Fail if a segment needs more compression; shorten its text instead.")
    args = parser.parse_args()
    schedule = json.loads(args.schedule.read_text())
    segments = schedule["segments"] if isinstance(schedule, dict) else schedule
    if not segments:
        raise ValueError("At least one narration segment is required")
    total = float(schedule.get("duration", 0)) if isinstance(schedule, dict) else 0
    previous_end = 0.0
    for segment in segments:
        start, duration = float(segment["start"]), float(segment["duration"])
        if start < previous_end or duration <= 0 or not str(segment["text"]).strip():
            raise ValueError("Segments must have text, positive duration, and non-overlapping chronological slots")
        previous_end = start + duration
        total = max(total, previous_end)
    args.output.parent.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory(prefix="peopleos-narration-") as temp:
        folder = Path(temp)
        clips = []
        report = []
        for index, segment in enumerate(segments):
            text_path = folder / f"segment-{index:02d}.txt"
            raw = folder / f"raw-{index:02d}.wav"
            fitted = folder / f"clip-{index:02d}.wav"
            text_path.write_text(str(segment["text"]), encoding="utf-8")
            # The generated temporary path is controlled and contains no filter delimiters.
            run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "lavfi",
                 "-i", f"flite=textfile={text_path}:voice={args.voice}", "-ar", "24000",
                 "-ac", "1", str(raw)])
            natural = probe_duration(raw)
            available = float(segment["duration"])
            speed = max(1.0, natural / max(available - 0.15, 0.05))
            if speed > args.max_speed:
                raise ValueError(f"Segment {index + 1} needs {natural:.1f}s in a {available:.1f}s slot. Shorten its text.")
            filters = (f"atempo={speed:.5f},highpass=f=65,"
                       f"loudnorm=I=-18:TP=-2:LRA=7,apad,atrim=duration={available},"
                       f"afade=t=out:st={max(0,available-.06):.3f}:d=0.06")
            run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(raw),
                 "-af", filters, "-ar", "24000", "-ac", "1", str(fitted)])
            clips.append(fitted)
            report.append({"segment": index + 1, "start": segment["start"],
                           "duration": available, "naturalDuration": round(natural, 3),
                           "speed": round(speed, 3), "text": segment["text"]})

        inputs = [part for clip in clips for part in ["-i", str(clip)]]
        delays = [f"[{i}:a]adelay={round(float(segment['start'])*1000)}:all=1[a{i}]"
                  for i, segment in enumerate(segments)]
        mix = "".join(f"[a{i}]" for i in range(len(clips)))
        graph = ";".join(delays + [
            f"{mix}amix=inputs={len(clips)}:duration=longest:normalize=0,"
            f"apad,atrim=duration={total},alimiter=limit=0.95:level=false[out]"
        ])
        run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *inputs,
             "-filter_complex", graph, "-map", "[out]", "-ar", "24000", "-ac", "1",
             "-c:a", "pcm_s16le", str(args.output)])
    args.output.with_suffix(".json").write_text(json.dumps({
        "engine": "FFmpeg Flite", "voice": args.voice, "duration": total,
        "syntheticVoice": True, "segments": report,
    }, indent=2) + "\n")
    print(f"Created {args.output} ({total:.1f}s, {len(segments)} narration segments, offline synthetic voice)")


if __name__ == "__main__":
    main()
