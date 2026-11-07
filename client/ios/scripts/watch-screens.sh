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

# The watch draws the Mac's clock in its corner, so the Mac goes to a zone in
# which it is about one o'clock: the hour the sample trip's screens are made for
# (WatchSample.swift), and the clock and the countdowns agree.
set_clock() {
  local offset=$(( (13 - 10#$(date -u +%H) + 36) % 24 - 12 ))
  local zone
  if [ "$offset" -ge 0 ]; then zone="Etc/GMT-$offset"; else zone="Etc/GMT+$(( -offset ))"; fi
  sudo ln -sf "/usr/share/zoneinfo/$zone" /etc/localtime
  echo "clock: $zone, $(date +%H:%M)"
}

# Waits for the ready file the app writes once the screen has drawn (DemoMode.signalReady).
wait_ready() {
  local udid=$1 token=$2 container
  for _ in $(seq 1 40); do
    container=$(xcrun simctl get_app_container "$udid" "$BUNDLE" data 2>/dev/null || true)
    [ -n "$container" ] && [ -f "$container/Documents/ready-$token" ] && return 0
    sleep 0.25
  done
  return 1
}

TOKEN=0
# shot <udid> <file> <screen> <scenario> <time or -> <language>: one launch, retried
# after 2, 5 and 10 seconds when the simulator refuses it.
shot() {
  local udid=$1 file=$2 screen=$3 scenario=$4 clock=$5 lang=$6
  local locale=${lang//-/_} attempt
  for attempt in 0 2 5 10; do
    [ "$attempt" -gt 0 ] && { echo "retrying $(basename "$file") in ${attempt}s"; sleep "$attempt"; }
    TOKEN=$((TOKEN + 1))
    xcrun simctl terminate "$udid" "$BUNDLE" >/dev/null 2>&1 || true
    sleep 0.5
    local extra=()
    [ "$clock" = - ] || extra=(-TrekNow "$clock")
    xcrun simctl launch "$udid" "$BUNDLE" \
      -AppleLanguages "($lang)" -AppleLocale "$locale" -TrekDemo "$screen" -TrekScenario "$scenario" \
      -TrekReady "$TOKEN" ${extra[@]+"${extra[@]}"} >/dev/null 2>&1 || continue
    wait_ready "$udid" "$TOKEN" || continue
    # The map's tiles come over the network after the screen is up.
    [ "$screen" = place ] && sleep 6
    xcrun simctl io "$udid" screenshot --type=png "$file" >/dev/null 2>&1 && return 0
  done
  echo "gave up on $(basename "$file")"
}

# name screen scenario clock: every screen, and the states a screen has; a
# clock only where the state needs another hour than the real one.
SHOTS="
today today running -
today-travelday today travelday -
today-done today running 22:30
day day running -
place place running -
booking booking travelday -
booking-dinner booking running -
bookings bookings travelday -
booking-detail booking-detail travelday -
trip trip running -
trip-upcoming trip upcoming -
days days running -
countdown countdown upcoming -
lists lists upcoming -
packing packing upcoming -
todos todos upcoming -
empty empty running -
nosync nosync running -
faces faces running -
"
MAIN="today booking countdown trip lists packing day"
LANGS="ar az ca cs de el en es et fr he hu id it ja ko nl pl pt-BR ru sk sv th tr uk vi zh-Hans zh-Hant"

# The watch draws its corner clock in its own region's format, not the app's:
# English goes first on a 12 hour clock, then the watch is switched to 24
# hours, as the other languages read it, and restarted for the clock to follow.
use_24_hours() {
  local udid=$1
  xcrun simctl spawn "$udid" defaults write -g AppleICUForce24HourTime -bool YES
  xcrun simctl spawn "$udid" defaults write -g AppleLocale de_DE
  xcrun simctl shutdown "$udid"
  xcrun simctl boot "$udid"
  xcrun simctl bootstatus "$udid" -b >/dev/null
}

EXPECTED=()
run() {
  local size=$1 udid=$2 lang shotname screen scenario clock
  for lang in en de ru; do
    [ "$lang" = de ] && use_24_hours "$udid"
    while read -r shotname screen scenario clock; do
      [ -n "$shotname" ] || continue
      EXPECTED+=("$size-$lang-$shotname.png")
      shot "$udid" "$OUT/$size-$lang-$shotname.png" "$screen" "$scenario" "$clock" "$lang"
    done <<< "$SHOTS"
  done
  if [ "$size" = small ]; then
    for lang in $LANGS; do
      case "$lang" in en|de|ru) continue ;; esac
      while read -r shotname screen scenario clock; do
        [ -n "$shotname" ] || continue
        case " $MAIN " in
          *" $shotname "*)
            EXPECTED+=("$size-$lang-$shotname.png")
            shot "$udid" "$OUT/$size-$lang-$shotname.png" "$screen" "$scenario" "$clock" "$lang"
            ;;
        esac
      done <<< "$SHOTS"
    done
  fi
  xcrun simctl shutdown "$udid" || true
}

# One watch at a time: launches on several booted simulators at once is what
# makes SpringBoard refuse them ("Scene update failed").
set_clock
run large "$(boot "$LARGE" | tail -1)"
run medium "$(boot "$MEDIUM" | tail -1)"
run small "$(boot "$SMALL" | tail -1)"
printf '%s\n' "large: $LARGE" "medium: $MEDIUM" "small: $SMALL" > "$OUT/devices.txt"

missing=0
for file in "${EXPECTED[@]}"; do
  [ -s "$OUT/$file" ] || { echo "missing: $file"; missing=$((missing + 1)); }
done
echo "${#EXPECTED[@]} expected, $missing missing"
[ "$missing" -eq 0 ]
