# Generating the audio clips

Clips are generated **once** on a Mac and committed to `public/audio/`.
Deploying the site never needs this; it only matters if you want to
(re)generate the voice.

Engine: [AI4Bharat Indic Parler-TTS](https://huggingface.co/ai4bharat/indic-parler-tts)
(Apache-2.0, free, runs locally). Clips are labelled "Computer voice" in
the app until a native speaker has checked them.

## Steps

1. Free about **6 GB** of disk space (model ~4 GB + PyTorch).
2. `npm run audio:setup` (creates `scripts/tts/.venv`; ~10 minutes).
3. Sign in at huggingface.co, open the model page above, and accept its
   terms. Then run `scripts/tts/.venv/bin/hf auth login` with a read token.
4. `npm run audio:generate -- --test` writes 5 clips to `scripts/tts/tmp/`.
   Listen. Try `--voice Harish` or `--voice Anju` if you prefer another.
5. `npm run audio:generate` creates the 300 most useful clips (letters in
   teaching order, then early syllables). Roughly 20–40 minutes on an
   M1 Pro. Stop any time with Ctrl+C; running it again resumes.
   `-- --all` does every clip in `clips.json` (~800).
6. Commit `public/audio/` and `src/data/audio-manifest.json`.

To delete a bad clip, remove its `.m4a` and run `npm run audio:generate`
again (it regenerates missing clips and rewrites the manifest).

`npm run audio:list` rebuilds `clips.json` if the curriculum changes.
