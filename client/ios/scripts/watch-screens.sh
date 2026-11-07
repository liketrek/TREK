#!/bin/bash
# Captures the watch app's screens from watchOS simulators, in screenshot mode
# (client/ios/App/TREKWatch/DemoMode.swift), for review and the App Store:
# every screen in English and German on the largest and the smallest watch,
# and the main screens in every language on the smallest, where text is
# tightest. .github/workflows/native.yml runs it after building the app.
#
#   watch-screens.sh <TREKWatch.app> <output directory>
set -euo pipefail

APP="$1"
OUT="$2"
BUNDLE=com.liketrek.trek.watchkitapp
mkdir -p "$OUT"

# The newest watchOS runtime, its newest Ultra, and the smallest watch it still runs on.
read -r RUNTIME LARGE SMALL < <(xcrun simctl list runtimes -j | python3 -c '
import json, re, sys
runtimes = [r for r in json.load(sys.stdin)["runtimes"] if r["platform"] == "watchOS" and r["isAvailable"]]
runtime = sorted(runtimes, key=lambda r: [int(x) for x in r["version"].split(".")])[-1]
names = [t["name"] for t in runtime["supportedDeviceTypes"]]
def mm(n):
    m = re.search(r"(\d+)mm", n); return int(m.group(1)) if m else 0
def gen(n):
    m = re.search(r"(?:Series|Ultra|SE) ?(\d+)?", n); return int(m.group(1) or 1) if m else 0
ultra = sorted([n for n in names if "Ultra" in n], key=gen)[-1]
small = sorted([n for n in names if "Ultra" not in n], key=lambda n: (mm(n), -gen(n)))[0]
print(runtime["identifier"], ultra.replace(" ", "_"), small.replace(" ", "_"))')
echo "runtime $RUNTIME"
LARGE=${LARGE//_/ }
SMALL=${SMALL//_/ }
echo "large: $LARGE, small: $SMALL"

boot() {
  local udid
  udid=$(xcrun simctl create "$1" "$1" "$RUNTIME")
  xcrun simctl boot "$udid"
  xcrun simctl bootstatus "$udid" -b >/dev/null
  xcrun simctl status_bar "$udid" override --time "13:05" >/dev/null 2>&1 || true
  xcrun simctl install "$udid" "$APP"
  echo "$udid"
}

# shot <udid> <file> <screen> <language> [extra launch arguments]
shot() {
  local udid=$1 file=$2 screen=$3 lang=$4
  shift 4
  local locale=${lang//-/_}
  xcrun simctl launch --terminate-running-process "$udid" "$BUNDLE" \
    -AppleLanguages "($lang)" -AppleLocale "$locale" -TrekDemo "$screen" "$@" >/dev/null || { echo "could not launch $file"; return 0; }
  case "$screen" in place) sleep 9 ;; *) sleep 4 ;; esac
  xcrun simctl io "$udid" screenshot --type=png "$file" >/dev/null 2>&1 || echo "could not capture $file"
}

ALL="today day place booking bookings trip days packing todos lists countdown empty nosync faces"
MAIN="today booking countdown trip lists packing"
LANGS="ar az ca cs de el en es et fr he hu id it ja ko nl pl pt-BR ru sk sv th tr uk vi zh-Hans zh-Hant"

run() {
  local size=$1 name=$2 udid
  udid=$(boot "$name" | tail -1)
  for lang in en de; do
    for screen in $ALL; do shot "$udid" "$OUT/$size-$lang-$screen.png" "$screen" "$lang"; done
  done
  if [ "$size" = small ]; then
    for lang in $LANGS; do
      [ "$lang" = en ] || [ "$lang" = de ] && continue
      for screen in $MAIN; do shot "$udid" "$OUT/$size-$lang-$screen.png" "$screen" "$lang"; done
    done
  fi
  xcrun simctl shutdown "$udid" || true
}

run large "$LARGE" &
large=$!
run small "$SMALL" &
small=$!
wait "$large"
wait "$small"
echo "$LARGE" > "$OUT/devices.txt"
echo "$SMALL" >> "$OUT/devices.txt"
ls "$OUT" | wc -l
