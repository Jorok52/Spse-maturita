#!/bin/bash
# Sestaví obě verze pro Linux (AppImage) a Windows (portable .exe) a zkopíruje je na plochu.
set -e
cd "$(dirname "$0")"
SRC="$1"                      # složka s app1.html / app2.html
OUT="$2"                      # cílová složka na ploše
mkdir -p "$OUT"
build() {  # $1 = číslo verze, $2 = název, $3.. = extra volby
  cp "$SRC/app$1.html" app.html
  rm -rf dist
  npx electron-builder --linux AppImage --win portable --x64 \
    -c.appId="cz.maturita.deska$1" -c.productName="$2" -c.extraMetadata.name="maturitni-deska-$1" \
    -c.extraMetadata.version="$1.0.0" -c.directories.output=dist \
    -c.win.icon=icon256.png -c.linux.icon=icon.png -c.linux.category=Education \
    -c.win.signAndEditExecutable=false \
    -c.portable.artifactName="Maturitni-deska-$1-Windows.exe" -c.linux.artifactName="Maturitni-deska-$1-Linux.AppImage" "${@:3}"
  cp dist/*.exe dist/*.AppImage "$OUT/"
  chmod +x "$OUT"/*.AppImage
}
[ -z "$ONLY3" ] && build 1 "Maturitní deska"
[ -z "$ONLY3" ] && build 2 "Maturitní deska 2"
rm -rf materialy; cp -r "$SRC/materialy" materialy
build 3 "Maturitní deska 3" -c.extraResources=materialy
