#!/bin/sh
# One-time setup for the audio generator (macOS). Needs ~6 GB of free disk.
set -e
cd "$(dirname "$0")"
command -v uv >/dev/null || { echo "Install uv first: curl -LsSf https://astral.sh/uv/install.sh | sh"; exit 1; }
# One dependency is fetched from a Git LFS repository; its large files are
# not needed, so disable LFS filters for this install (works without git-lfs).
export GIT_LFS_SKIP_SMUDGE=1 GIT_CONFIG_COUNT=3 \
  GIT_CONFIG_KEY_0=filter.lfs.process GIT_CONFIG_VALUE_0= \
  GIT_CONFIG_KEY_1=filter.lfs.smudge GIT_CONFIG_VALUE_1=cat \
  GIT_CONFIG_KEY_2=filter.lfs.required GIT_CONFIG_VALUE_2=false
uv venv --allow-existing --python 3.12 .venv
uv pip install --python .venv/bin/python torch soundfile numpy "protobuf>=5.28" "git+https://github.com/huggingface/parler-tts.git"
echo
echo "Next:"
echo "  1. Open https://huggingface.co/ai4bharat/indic-parler-tts, sign in, and accept the terms."
echo "  2. Run: scripts/tts/.venv/bin/hf auth login   (paste a read token from huggingface.co/settings/tokens)"
echo "  3. Run: npm run audio:generate -- --test      (listen to 5 sample clips first)"
