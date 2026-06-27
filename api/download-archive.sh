#!/usr/bin/env bash
# ------------------------------------------------------------------
# Bulk-download the Fight Club archive as MP3 into FC_MEDIA_DIR.
# Source: the show's official on-demand (Mixcloud) full-length episodes,
# transcoded to mp3 (universal, plays on iOS). Resumable (skips existing),
# disk-aware (stops before the volume gets too full). Needs yt-dlp + ffmpeg.
#
#   FC_MEDIA_DIR=/path/to/archive ./download-archive.sh
#   MIN_FREE_GB=30 LIMIT=20 FC_MEDIA_DIR=... ./download-archive.sh
# ------------------------------------------------------------------
set -uo pipefail
export PATH="$HOME/.local/bin:$PATH"

HERE="$(cd "$(dirname "$0")" && pwd)"
DIR="${FC_MEDIA_DIR:?set FC_MEDIA_DIR to a writable archive dir}"
DATA="$HERE/data/episodes.json"
MIN_FREE_GB="${MIN_FREE_GB:-20}"   # stop if free space drops below this
LIMIT="${LIMIT:-0}"                # 0 = no limit
mkdir -p "$DIR"

i=0
while IFS=$'\t' read -r date url; do
  [ -z "$url" ] && continue
  y=${date:0:4}
  out="$DIR/$y/$date - Fight Club - Fight Club.mp3"
  [ -f "$out" ] && continue
  free=$(df -BG --output=avail "$DIR" 2>/dev/null | tail -1 | tr -dc 0-9)
  if [ -n "$free" ] && [ "$free" -lt "$MIN_FREE_GB" ]; then
    echo "stopping: only ${free}GB free (< ${MIN_FREE_GB}GB)"; break
  fi
  mkdir -p "$DIR/$y"
  echo ">> $date"
  yt-dlp -f bestaudio -x --audio-format mp3 --audio-quality 5 \
    --no-part --no-playlist --retries 3 --socket-timeout 30 \
    -o "$DIR/$y/$date - Fight Club - Fight Club.%(ext)s" "$url" \
    || echo "   failed: $date (continuing)"
  i=$((i+1))
  [ "$LIMIT" -gt 0 ] && [ "$i" -ge "$LIMIT" ] && { echo "reached LIMIT=$LIMIT"; break; }
done < <(node -e '
  const eps = require(process.argv[1]);
  eps.filter(e => e.mixcloud && !e.file)
     .sort((a,b)=> a.date<b.date?1:-1)
     .forEach(e => console.log(e.date + "\t" + e.mixcloud));
' "$DATA")

echo ">> linking downloaded media into the catalog"
node "$HERE/link-media.cjs"
echo "done."
