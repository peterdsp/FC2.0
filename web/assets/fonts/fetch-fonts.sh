#!/usr/bin/env bash
# ------------------------------------------------------------------
# Fetch + subset SF Pro Display for self-hosting (Latin + Greek woff2).
#
# SF Pro Display is © Apple. We do NOT redistribute the binaries in this
# public repo — run this locally / on the server to generate them.
# On Apple devices the site uses the native system font via -apple-system
# (zero download), so this only affects non-Apple browsers.
#
# Requires: curl, unzip, python3 with fonttools + brotli
#   pip3 install fonttools brotli
# ------------------------------------------------------------------
set -euo pipefail
cd "$(dirname "$0")"

TMP="$(mktemp -d)"
echo "→ downloading SF Pro Display…"
curl -sL -A "Mozilla/5.0" "https://font.download/dl/font/sf-pro-display.zip" -o "$TMP/sfpro.zip"
unzip -o -j "$TMP/sfpro.zip" "SFPRODISPLAYREGULAR.OTF" "SFPRODISPLAYMEDIUM.OTF" "SFPRODISPLAYBOLD.OTF" -d "$TMP" >/dev/null

# Latin + Greek + punctuation/symbols used in the UI
UNI="U+0000-00FF,U+0100-017F,U+0370-03FF,U+1F00-1FFF,U+2000-206F,U+2070-209F,U+20A0-20BF,U+2122,U+2190-21FF,U+2600-26FF"

for pair in "REGULAR:Regular" "MEDIUM:Medium" "BOLD:Bold"; do
  src="SFPRODISPLAY${pair%%:*}.OTF"; out="SFProDisplay-${pair##*:}.woff2"
  echo "→ subsetting $out"
  python3 -m fontTools.subset "$TMP/$src" --unicodes="$UNI" --layout-features='*' \
    --flavor=woff2 --output-file="./$out"
done
rm -rf "$TMP"
echo "✓ Done: $(ls -1 *.woff2 | tr '\n' ' ')"
