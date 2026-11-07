#!/bin/sh
# One-time setup for the audio generator (macOS). Needs ~6 GB of free disk.
set -e
cd "$(dirname "$0")"
command -v uv >/dev/null || { echo "Install uv first: curl -LsSf https://astral.sh/uv/install.sh | sh"; exit 1; }
uv venv --python 3.12 .venv
uv pip install --python .venv/bin/python torch soundfile numpy "git+https://github.com/huggingface/parler-tts.git"
echo
echo "Next:"
echo "  1. Open https://huggingface.co/ai4bharat/indic-parler-tts, sign in, and accept the terms."
echo "  2. Run: scripts/tts/.venv/bin/hf auth login   (paste a read token from huggingface.co/settings/tokens)"
echo "  3. Run: npm run audio:generate -- --test      (listen to 5 sample clips first)"
