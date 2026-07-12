#!/usr/bin/env node
// Build server/assets/airports.json from OurAirports (davidmegginson.github.io/ourairports-data).
// License: Public Domain. Keeps large/medium airports with an IATA code; timezone derived from coords via tz-lookup.
import fs from 'node:fs';
import https from 'node:https';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tzLookup from 'tz-lookup';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'assets', 'airports.json');
const SRC = 'https://davidmegginson.github.io/ourairports-data/airports.csv';

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => resolve(data));
      })
      .on('error', reject);
  });
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ',') {
        row.push(cur);
        cur = '';
      } else if (ch === '\n') {
        row.push(cur);
        rows.push(row);
        row = [];
        cur = '';
      } else if (ch === '\r') {
        /* skip */
      } else cur += ch;
    }
  }
  if (cur.length > 0 || row.length > 0) {
    row.push(cur);
    rows.push(row);
  }
  return rows;
}

const raw = await fetchText(SRC);
const rows = parseCsv(raw);
const header = rows[0];
const idx = (name) => header.indexOf(name);
const TYPE = idx('type');
const NAME = idx('name');
const LAT = idx('latitude_deg');
const LNG = idx('longitude_deg');
const COUNTRY = idx('iso_country');
const MUNICIPALITY = idx('municipality');
const SERVICE = idx('scheduled_service');
const ICAO = idx('icao_code');
const IATA = idx('iata_code');

const KEEP = new Set(['large_airport', 'medium_airport', 'small_airport']);
const airports = [];
let skippedNoTz = 0;

for (let i = 1; i < rows.length; i++) {
  const r = rows[i];
  if (!r || r.length < header.length) continue;
  if (!KEEP.has(r[TYPE])) continue;
  const iata = r[IATA]?.trim().toUpperCase();
  if (!iata || iata.length !== 3) continue;
  if (r[SERVICE] !== 'yes') continue;
  const lat = Number(r[LAT]);
  const lng = Number(r[LNG]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

  let tz = null;
  try {
    tz = tzLookup(lat, lng);
  } catch {
    skippedNoTz++;
    continue;
  }
  if (!tz) {
    skippedNoTz++;
    continue;
  }

  airports.push({
    iata,
    icao: r[ICAO]?.trim().toUpperCase() || null,
    name: r[NAME],
    city: r[MUNICIPALITY] || '',
    country: r[COUNTRY] || '',
    lat: Math.round(lat * 1e6) / 1e6,
    lng: Math.round(lng * 1e6) / 1e6,
    tz,
  });
}

const seen = new Map();
for (const a of airports) {
  const existing = seen.get(a.iata);
  if (!existing) {
    seen.set(a.iata, a);
    continue;
  }
  if (existing.icao && !a.icao) continue;
  if (!existing.icao && a.icao) seen.set(a.iata, a);
}
const unique = Array.from(seen.values()).sort((a, b) => a.iata.localeCompare(b.iata));

fs.writeFileSync(OUT, JSON.stringify(unique));
const size = fs.statSync(OUT).size;
console.log(
  `Wrote ${unique.length} airports to ${OUT} (${(size / 1024).toFixed(1)} KB); skipped ${skippedNoTz} without timezone`,
);
