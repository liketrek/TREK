#!/bin/bash
# Captures the watch app's screens from watchOS simulators, in screenshot mode
# (client/ios/App/TREKWatch/DemoMode.swift), for review and the App Store:
# every screen and its states in English, German and Russian on the newest
# Ultra, the largest other watch and the smallest one, and the main screens in
# every language on the smallest, where text is tightest.
# .github/workflows/native.yml runs it after building the app.
#
#   watch-screens.sh <TREKWatch.app> <output directory>
set -euo pipefail

APP="$1"
OUT="$2"
BUNDLE=com.liketrek.trek.watchkitapp
mkdir -p "$OUT"

# The newest watchOS runtime, its newest Ultra, the largest other watch and the
# smallest one it still runs on.
read -r RUNTIME LARGE MEDIUM SMALL < <(xcrun simctl list runtimes -j | python3 -c '
import json, re, sys
runtimes = [r for r in json.load(sys.stdin)["runtimes"] if r["platform"] == "watchOS" and r["isAvailable"]]
runtime = sorted(runtimes, key=lambda r: [int(x) for x in r["version"].split(".")])[-1]
names = [t["name"] for t in runtime["supportedDeviceTypes"]]
def mm(n):
    m = re.search(r"(\d+)mm", n); return int(m.group(1)) if m else 0
def gen(n):
    m = re.search(r"(?:Series|Ultra|SE) ?(\d+)?", n); return int(m.group(1) or 1) if m else 0
ultra = sorted([n for n in names if "Ultra" in n], key=gen)[-1]
rest = sorted([n for n in names if "Ultra" not in n], key=lambda n: (mm(n), gen(n)))
print(runtime["identifier"], *[n.replace(" ", "_") for n in (ultra, rest[-1], rest[0])])')
LARGE=${LARGE//_/ }
MEDIUM=${MEDIUM//_/ }
SMALL=${SMALL//_/ }
echo "runtime $RUNTIME; large: $LARGE, medium: $MEDIUM, small: $SMALL"

boot() {
  local udid
  udid=$(xcrun simctl create "$1" "$1" "$RUNTIME")
  xcrun simctl boot "$udid"
  xcrun simctl bootstatus "$udid" -b >/dev/null
  xcrun simctl install "$udid" "$APP"
  echo "$udid"
}

# A fixed-offset zone in which it is now <hour> o'clock, so the clock the
# watch draws in the corner agrees with the time the screen is about.
zone_for() {
  local offset=$(( ($1 - 10#$(date -u +%H) + 36) % 24 - 12 ))
  if [ "$offset" -ge 0 ]; then echo "Etc/GMT-$offset"; else echo "Etc/GMT+$(( -offset ))"; fi
}

# shot <udid> <file> <screen> <scenario> <hour> <language>
shot() {
  local udid=$1 file=$2 screen=$3 scenario=$4 hour=$5 lang=$6
  local locale=${lang//-/_}
  SIMCTL_CHILD_TZ=$(zone_for "$hour") xcrun simctl launch --terminate-running-process "$udid" "$BUNDLE" \
    -AppleLanguages "($lang)" -AppleLocale "$locale" -TrekDemo "$screen" -TrekScenario "$scenario" >/dev/null \
    || { echo "could not launch $file"; return 0; }
  case "$screen" in place) sleep 10 ;; *) sleep 4 ;; esac
  xcrun simctl io "$udid" screenshot --type=png "$file" >/dev/null 2>&1 || echo "could not capture $file"
}

# name screen scenario hour: every screen, and the states a screen has.
SHOTS="
today today running 13
today-travelday today travelday 10
today-done today running 22
day day running 13
place place running 13
booking booking travelday 10
booking-dinner booking running 17
bookings bookings travelday 10
booking-detail booking-detail travelday 10
trip trip running 13
trip-upcoming trip upcoming 9
days days running 13
countdown countdown upcoming 9
lists lists upcoming 19
packing packing upcoming 19
todos todos upcoming 19
empty empty running 12
nosync nosync running 12
faces faces running 13
"
MAIN="today booking countdown trip lists packing day"
LANGS="ar az ca cs de el en es et fr he hu id it ja ko nl pl pt-BR ru sk sv th tr uk vi zh-Hans zh-Hant"

run() {
  local size=$1 name=$2 udid
  udid=$(boot "$name" | tail -1)
  for lang in en de ru; do
    while read -r shotname screen scenario hour; do
      [ -n "$shotname" ] || continue
      shot "$udid" "$OUT/$size-$lang-$shotname.png" "$screen" "$scenario" "$hour" "$lang"
    done <<< "$SHOTS"
  done
  if [ "$size" = small ]; then
    for lang in $LANGS; do
      case "$lang" in en|de|ru) continue ;; esac
      while read -r shotname screen scenario hour; do
        [ -n "$shotname" ] || continue
        case " $MAIN " in *" $shotname "*) shot "$udid" "$OUT/$size-$lang-$shotname.png" "$screen" "$scenario" "$hour" "$lang" ;; esac
      done <<< "$SHOTS"
    done
  fi
  xcrun simctl shutdown "$udid" || true
}

run large "$LARGE" &
large=$!
run medium "$MEDIUM" &
medium=$!
run small "$SMALL" &
small=$!
wait "$large"
wait "$medium"
wait "$small"
printf '%s\n' "large: $LARGE" "medium: $MEDIUM" "small: $SMALL" > "$OUT/devices.txt"
ls "$OUT" | wc -l
