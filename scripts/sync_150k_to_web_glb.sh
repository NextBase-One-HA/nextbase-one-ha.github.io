#!/bin/bash
# 150系辞書の正本を Web GLB の dictionary/150k.csv にコピーする。
# 使い方: ./scripts/sync_150k_to_web_glb.sh [正本CSVのパス]

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DEST="$REPO_ROOT/dictionary/150k.csv"

# 引数がなければ候補から探す
if [ -n "$1" ]; then
  SRC="$1"
else
  SRC=""
  for p in \
    "$HOME/Desktop/GoogleDrive_GLB/GLB_Dictionary_Package/dictionary_data/custom_dictionary_150k.csv" \
    "$HOME/Desktop/GoogleDrive_GLB/for_glb_150/assets/dictionary/custom_dictionary_150.csv"; do
    if [ -f "$p" ]; then
      SRC="$p"
      break
    fi
  done
fi

if [ -z "$SRC" ] || [ ! -f "$SRC" ]; then
  echo "Error: 正本のCSVが見つかりません。"
  echo "Usage: $0 /path/to/custom_dictionary_150k.csv"
  echo "または 以下のいずれかにファイルを置いてください:"
  echo "  - $HOME/Desktop/GoogleDrive_GLB/GLB_Dictionary_Package/dictionary_data/custom_dictionary_150k.csv"
  echo "  - $HOME/Desktop/GoogleDrive_GLB/for_glb_150/assets/dictionary/custom_dictionary_150.csv"
  exit 1
fi

mkdir -p "$(dirname "$DEST")"
cp "$SRC" "$DEST"
echo "Copied: $SRC -> $DEST"
