#!/usr/bin/env node
// Build server/assets/airlines-icao.json, the IATA airline code -> ICAO callsign prefix table the
// live flight status uses to turn a booked flight number ("LH 716") into the callsign an aircraft
// transmits ("DLH716").
//
// Source: VRS standing data (github.com/vradarserver/standing-data, CC0): airlines/schema-01 for
// the codes and the file list of routes/schema-01 for which airline still flies.
//
// Only airlines with both codes are kept. IATA reuses its two-character codes, so one IATA code
// often names several ICAO airlines (LH: Lufthansa and Lufthansa Cargo; U2: easyJet and United
// Feeder Service). The airline list carries no "active" flag, so the rule is: the ICAO airline
// with the most route data in the standing data wins (the summed size of its routes files), since
// routes are only recorded for callsigns seen flying. A shared code where no candidate has any
// route data is left out rather than guessed; a booking with it is then simply not tracked.
import fs from 'node:fs';
import https from 'node:https';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'assets', 'airlines-icao.json');
const AIRLINES = 'https://raw.githubusercontent.com/vradarserver/standing-data/main/airlines/schema-01/airlines.csv';
const TREE = 'https://api.github.com/repos/vradarserver/standing-data/git/trees/main?recursive=1';

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { 'User-Agent': 'trek-build-airlines', Accept: '*/*' } }, (res) => {
        if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
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

/** One CSV line into its fields: optional double quotes, "" as an escaped quote. */
function parseLine(line) {
  const fields = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') inQuotes = false;
      else cur += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ',') {
      fields.push(cur);
      cur = '';
    } else cur += ch;
  }
  fields.push(cur);
  return fields;
}

const csv = (await fetchText(AIRLINES)).replace(/^﻿/, '');
const tree = JSON.parse(await fetchText(TREE));
if (tree.truncated) throw new Error('The standing-data tree came back truncated; the route sizes would be incomplete');

// Bytes of route data per ICAO code: routes/schema-01/<letter>/<CODE>-all.csv or <CODE>-<digit>.csv.
const routeBytes = new Map();
for (const entry of tree.tree) {
  const match = /^routes\/schema-01\/[A-Z0-9]\/([A-Z]{3})-(?:all|\d)\.csv$/.exec(entry.path);
  if (!match) continue;
  routeBytes.set(match[1], (routeBytes.get(match[1]) ?? 0) + (entry.size ?? 0));
}

const rows = csv.split(/\r?\n/);
const header = parseLine(rows[0]);
const ICAO = header.indexOf('ICAO');
const IATA = header.indexOf('IATA');
const candidates = new Map();
for (const line of rows.slice(1)) {
  if (!line.trim()) continue;
  const fields = parseLine(line);
  const icao = fields[ICAO]?.trim().toUpperCase();
  const iata = fields[IATA]?.trim().toUpperCase();
  if (!icao || !iata || !/^[A-Z]{3}$/.test(icao) || !/^(?=.*[A-Z])[A-Z0-9]{2}$/.test(iata)) continue;
  const list = candidates.get(iata) ?? [];
  if (!list.includes(icao)) list.push(icao);
  candidates.set(iata, list);
}

const table = {};
let shared = 0;
let dropped = 0;
for (const iata of [...candidates.keys()].sort()) {
  const list = candidates.get(iata);
  if (list.length === 1) {
    table[iata] = list[0];
    continue;
  }
  shared++;
  const ranked = list
    .map((icao) => ({ icao, bytes: routeBytes.get(icao) ?? 0 }))
    .sort((a, b) => b.bytes - a.bytes || a.icao.localeCompare(b.icao));
  if (ranked[0].bytes === 0) {
    dropped++;
    continue;
  }
  table[iata] = ranked[0].icao;
}

fs.writeFileSync(OUT, JSON.stringify(table));
console.log(
  `Wrote ${Object.keys(table).length} airline codes to ${OUT}; ${shared} shared IATA codes resolved by route data, ${dropped} left out without any`,
);
