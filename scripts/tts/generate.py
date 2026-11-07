"""Generate Malayalam audio clips with AI4Bharat Indic Parler-TTS (Apache-2.0).

Run from the repository root after `npm run audio:setup`:

    npm run audio:generate               # first 300 clips (letters + early syllables)
    npm run audio:generate -- --test     # 5 clips into scripts/tts/tmp to listen first
    npm run audio:generate -- --all      # every clip in clips.json (~800, slow)
    npm run audio:generate -- --voice Harish

Resumable: clips already in public/audio are skipped. Each clip is trimmed,
converted to AAC (.m4a) with macOS `afconvert`, and listed in
src/data/audio-manifest.json so the site starts using it immediately.
"""

import argparse
import json
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CLIPS = ROOT / "scripts/tts/clips.json"
OUT = ROOT / "public/audio"
TMP = ROOT / "scripts/tts/tmp"
MANIFEST = ROOT / "src/data/audio-manifest.json"
MODEL = "ai4bharat/indic-parler-tts"


def write_manifest(voice: str) -> int:
    keys = sorted(p.stem for p in OUT.glob("*.m4a"))
    MANIFEST.write_text(
        json.dumps({"voice": f"Indic Parler-TTS ({voice})", "clips": keys}, indent=2)
        + "\n",
        encoding="utf-8",
    )
    return len(keys)


def trim(audio, rate):
    import numpy as np

    level = np.abs(audio)
    threshold = max(level.max() * 0.03, 1e-4)
    voiced = np.where(level > threshold)[0]
    if not len(voiced):
        return audio
    pad = int(0.08 * rate)
    start = max(0, voiced[0] - pad)
    end = min(len(audio), voiced[-1] + pad)
    clip = audio[start:end]
    peak = np.abs(clip).max()
    return clip / peak * 0.9 if peak > 0 else clip


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=300)
    parser.add_argument("--all", action="store_true")
    parser.add_argument("--test", action="store_true", help="5 clips into scripts/tts/tmp")
    parser.add_argument("--voice", default="Anjali", help="Malayalam voices: Anjali, Anju, Harish")
    args = parser.parse_args()

    import soundfile as sf
    import torch
    from parler_tts import ParlerTTSForConditionalGeneration
    from transformers import AutoTokenizer

    clips = json.loads(CLIPS.read_text(encoding="utf-8"))
    if args.test:
        clips, target = clips[:5], TMP
    else:
        clips, target = (clips if args.all else clips[: args.limit]), OUT
    target.mkdir(parents=True, exist_ok=True)
    todo = [c for c in clips if not (target / f"{c['key']}.m4a").exists()]
    if not todo:
        print("Nothing to do: every requested clip already exists.")
        if not args.test:
            print(f"Manifest lists {write_manifest(args.voice)} clips.")
        return

    device = "mps" if torch.backends.mps.is_available() else "cpu"
    print(f"Loading {MODEL} on {device} (first run downloads ~4 GB)…")
    model = ParlerTTSForConditionalGeneration.from_pretrained(MODEL).to(device)
    tokenizer = AutoTokenizer.from_pretrained(MODEL)
    describer = AutoTokenizer.from_pretrained(model.config.text_encoder._name_or_path)
    rate = model.config.sampling_rate
    description = (
        f"{args.voice} speaks slowly and clearly, with a calm, neutral tone, "
        "in a close-sounding recording with very clear audio and no background noise."
    )
    desc = describer(description, return_tensors="pt").to(device)

    started = time.time()
    for i, clip in enumerate(todo, 1):
        # A full stop helps the model end cleanly on very short inputs.
        prompt = tokenizer(clip["text"] + ".", return_tensors="pt").to(device)
        with torch.no_grad():
            audio = model.generate(
                input_ids=desc.input_ids,
                attention_mask=desc.attention_mask,
                prompt_input_ids=prompt.input_ids,
                prompt_attention_mask=prompt.attention_mask,
            )
        samples = trim(audio.cpu().numpy().squeeze(), rate)
        wav = TMP / f"{clip['key']}.wav"
        TMP.mkdir(parents=True, exist_ok=True)
        sf.write(wav, samples, rate)
        m4a = target / f"{clip['key']}.m4a"
        subprocess.run(
            ["afconvert", "-f", "m4af", "-d", "aac", "-b", "64000", str(wav), str(m4a)],
            check=True,
        )
        wav.unlink()
        if not args.test:
            write_manifest(args.voice)  # after every clip, so stopping is safe
        per = (time.time() - started) / i
        left = per * (len(todo) - i) / 60
        print(f"[{i}/{len(todo)}] {clip['text']} ({clip['label']}) · ~{left:.0f} min left", flush=True)

    if args.test:
        print(f"Listen to the test clips in {TMP}, then run without --test.")
    else:
        print(f"Done. Manifest lists {write_manifest(args.voice)} clips.")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        sys.exit("Stopped. Run the same command again to resume.")
