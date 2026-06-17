#!/usr/bin/env node
// Build server/assets/atlas/{admin0,admin1}.geojson.gz from geoBoundaries (gbOpen).
//
// Why: Atlas previously fetched country + sub-national boundaries from Natural Earth's
// GitHub `master` at runtime. Natural Earth is stale (e.g. it still shows Norway's
// pre-2020 counties) and depicts some contested territory in ways the project does not
// want (see nvkelso/natural-earth-vector#391). geoBoundaries (CC BY 4.0) is current,
// redistributable, and carries ISO 3166-2 codes on its per-country ADM1 files.
//
// This downloads the *simplified* per-country gbOpen ADM0 (countries) and ADM1
// (regions) layers from a pinned geoBoundaries revision, normalizes each feature to
// the property names the Atlas client/server already read, and writes two gzipped
// FeatureCollections that the server serves at runtime (no network at boot).
//
// geoBoundaries: CC BY 4.0 — https://www.geoboundaries.org/  (attribution required).

import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR = path.join(__dirname, '..', 'assets', 'atlas')

// Pinned geoBoundaries revision (override with GB_REF=<sha|branch|tag>). The LFS media
// endpoint resolves a commit SHA, branch, or tag in the <ref> path segment.
const GB_REF = process.env.GB_REF || '5c25134028196d43ce97b5071934fd0cfc92f09f'
const MEDIA = (a3, level) =>
  `https://media.githubusercontent.com/media/wmgeolab/geoBoundaries/${GB_REF}` +
  `/releaseData/gbOpen/${a3}/${level}/geoBoundaries-${a3}-${level}_simplified.geojson`

// Country borders come from CGAZ (the Comprehensive Global Administrative Zones composite)
// rather than per-country gbOpen ADM0: CGAZ is gap-filled, so it includes territories
// that gbOpen omits or folds away — notably Svalbard (inside Norway's geometry) and
// Greenland. The country layer only needs A3/A2/name, so CGAZ's lack of `shapeISO` is
// irrelevant. (gbOpen ADM0 maxes Norway at 71°N and has no Svalbard at all.)
const CGAZ_ADM0 =
  `https://media.githubusercontent.com/media/wmgeolab/geoBoundaries/${GB_REF}` +
  `/releaseData/CGAZ/geoBoundariesCGAZ_ADM0.geojson`

const CONCURRENCY = 8
const RETRIES = 3

// Complete ISO-3166-1 alpha-3 → alpha-2 map (source: lukes/ISO-3166-Countries-with-
// Regional-Codes). Drives ADM1 enumeration (one gbOpen request per code; missing ones
// 404 and are skipped) and stamps `iso_a2`/`ISO_A2` (geoBoundaries keys by alpha-3
// `shapeGroup`). A complete map — not the client's curated ~180 — is what restores the
// dropped territories (Greenland, Falklands, French Guiana, …).
const A3_TO_A2 = {"ABW":"AW", "AFG":"AF", "AGO":"AO", "AIA":"AI", "ALA":"AX", "ALB":"AL", "AND":"AD", "ARE":"AE", "ARG":"AR", "ARM":"AM", "ASM":"AS", "ATA":"AQ", "ATF":"TF", "ATG":"AG", "AUS":"AU", "AUT":"AT", "AZE":"AZ", "BDI":"BI", "BEL":"BE", "BEN":"BJ", "BES":"BQ", "BFA":"BF", "BGD":"BD", "BGR":"BG", "BHR":"BH", "BHS":"BS", "BIH":"BA", "BLM":"BL", "BLR":"BY", "BLZ":"BZ", "BMU":"BM", "BOL":"BO", "BRA":"BR", "BRB":"BB", "BRN":"BN", "BTN":"BT", "BVT":"BV", "BWA":"BW", "CAF":"CF", "CAN":"CA", "CCK":"CC", "CHE":"CH", "CHL":"CL", "CHN":"CN", "CIV":"CI", "CMR":"CM", "COD":"CD", "COG":"CG", "COK":"CK", "COL":"CO", "COM":"KM", "CPV":"CV", "CRI":"CR", "CUB":"CU", "CUW":"CW", "CXR":"CX", "CYM":"KY", "CYP":"CY", "CZE":"CZ", "DEU":"DE", "DJI":"DJ", "DMA":"DM", "DNK":"DK", "DOM":"DO", "DZA":"DZ", "ECU":"EC", "EGY":"EG", "ERI":"ER", "ESH":"EH", "ESP":"ES", "EST":"EE", "ETH":"ET", "FIN":"FI", "FJI":"FJ", "FLK":"FK", "FRA":"FR", "FRO":"FO", "FSM":"FM", "GAB":"GA", "GBR":"GB", "GEO":"GE", "GGY":"GG", "GHA":"GH", "GIB":"GI", "GIN":"GN", "GLP":"GP", "GMB":"GM", "GNB":"GW", "GNQ":"GQ", "GRC":"GR", "GRD":"GD", "GRL":"GL", "GTM":"GT", "GUF":"GF", "GUM":"GU", "GUY":"GY", "HKG":"HK", "HMD":"HM", "HND":"HN", "HRV":"HR", "HTI":"HT", "HUN":"HU", "IDN":"ID", "IMN":"IM", "IND":"IN", "IOT":"IO", "IRL":"IE", "IRN":"IR", "IRQ":"IQ", "ISL":"IS", "ISR":"IL", "ITA":"IT", "JAM":"JM", "JEY":"JE", "JOR":"JO", "JPN":"JP", "KAZ":"KZ", "KEN":"KE", "KGZ":"KG", "KHM":"KH", "KIR":"KI", "KNA":"KN", "KOR":"KR", "KWT":"KW", "LAO":"LA", "LBN":"LB", "LBR":"LR", "LBY":"LY", "LCA":"LC", "LIE":"LI", "LKA":"LK", "LSO":"LS", "LTU":"LT", "LUX":"LU", "LVA":"LV", "MAC":"MO", "MAF":"MF", "MAR":"MA", "MCO":"MC", "MDA":"MD", "MDG":"MG", "MDV":"MV", "MEX":"MX", "MHL":"MH", "MKD":"MK", "MLI":"ML", "MLT":"MT", "MMR":"MM", "MNE":"ME", "MNG":"MN", "MNP":"MP", "MOZ":"MZ", "MRT":"MR", "MSR":"MS", "MTQ":"MQ", "MUS":"MU", "MWI":"MW", "MYS":"MY", "MYT":"YT", "NAM":"NA", "NCL":"NC", "NER":"NE", "NFK":"NF", "NGA":"NG", "NIC":"NI", "NIU":"NU", "NLD":"NL", "NOR":"NO", "NPL":"NP", "NRU":"NR", "NZL":"NZ", "OMN":"OM", "PAK":"PK", "PAN":"PA", "PCN":"PN", "PER":"PE", "PHL":"PH", "PLW":"PW", "PNG":"PG", "POL":"PL", "PRI":"PR", "PRK":"KP", "PRT":"PT", "PRY":"PY", "PSE":"PS", "PYF":"PF", "QAT":"QA", "REU":"RE", "ROU":"RO", "RUS":"RU", "RWA":"RW", "SAU":"SA", "SDN":"SD", "SEN":"SN", "SGP":"SG", "SGS":"GS", "SHN":"SH", "SJM":"SJ", "SLB":"SB", "SLE":"SL", "SLV":"SV", "SMR":"SM", "SOM":"SO", "SPM":"PM", "SRB":"RS", "SSD":"SS", "STP":"ST", "SUR":"SR", "SVK":"SK", "SVN":"SI", "SWE":"SE", "SWZ":"SZ", "SXM":"SX", "SYC":"SC", "SYR":"SY", "TCA":"TC", "TCD":"TD", "TGO":"TG", "THA":"TH", "TJK":"TJ", "TKL":"TK", "TKM":"TM", "TLS":"TL", "TON":"TO", "TTO":"TT", "TUN":"TN", "TUR":"TR", "TUV":"TV", "TWN":"TW", "TZA":"TZ", "UGA":"UG", "UKR":"UA", "UMI":"UM", "URY":"UY", "USA":"US", "UZB":"UZ", "VAT":"VA", "VCT":"VC", "VEN":"VE", "VGB":"VG", "VIR":"VI", "VNM":"VN", "VUT":"VU", "WLF":"WF", "WSM":"WS", "YEM":"YE", "ZAF":"ZA", "ZMB":"ZM", "ZWE":"ZW"}

const COUNTRIES = Object.keys(A3_TO_A2) // every ISO alpha-3 code (ADM1 fetch list)

// Cache raw downloads so re-runs (e.g. to tune simplification) don't re-fetch ~360 files.
const CACHE_DIR = path.join(__dirname, '..', '.atlas-geo-cache', GB_REF)

async function fetchGeo(url) {
  const cacheFile = path.join(CACHE_DIR, url.split('/').slice(-1)[0])
  if (fs.existsSync(cacheFile)) {
    const cached = fs.readFileSync(cacheFile, 'utf8')
    return cached === '' ? null : JSON.parse(cached)
  }
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'TREK atlas builder' } })
      if (res.status === 404) { fs.writeFileSync(cacheFile, ''); return null } // no file — skip
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const text = await res.text()
      if (text.startsWith('version https://git-lfs')) throw new Error('got LFS pointer, not content')
      const parsed = JSON.parse(text)
      fs.writeFileSync(cacheFile, text)
      return parsed
    } catch (err) {
      if (attempt === RETRIES) {
        console.warn(`  ! ${url.split('/').slice(-1)[0]}: ${err.message}`)
        return null
      }
      await new Promise(r => setTimeout(r, 500 * attempt))
    }
  }
  return null
}

// Run async tasks with a fixed concurrency cap.
async function pool(items, worker) {
  const results = []
  let i = 0
  const runners = Array.from({ length: CONCURRENCY }, async () => {
    while (i < items.length) {
      const idx = i++
      results[idx] = await worker(items[idx], idx)
    }
  })
  await Promise.all(runners)
  return results
}

// Geometry size control. geoBoundaries' "_simplified" files still carry ~12-decimal
// coordinates, which dominate the JSON size. Quantizing to a fixed grid (rounding
// preserves topology — identical input coords map to identical output) and dropping
// the now-redundant consecutive duplicate points shrinks the bundles ~5-8x with no
// visible effect at the atlas' zoom range (3-10). ADM0 fills are viewed zoomed out, so
// they tolerate a coarser grid than ADM1 region borders.
const ADM0_DECIMALS = 2 // ~1.1 km
const ADM1_DECIMALS = 3 // ~110 m

function quantizeRing(ring, decimals) {
  const m = 10 ** decimals
  const out = []
  let prevX, prevY
  for (const pt of ring) {
    const x = Math.round(pt[0] * m) / m
    const y = Math.round(pt[1] * m) / m
    if (x === prevX && y === prevY) continue
    out.push([x, y])
    prevX = x; prevY = y
  }
  return out
}

// Quantize a (Multi)Polygon, dropping rings that collapse below a valid ring (<4 pts).
function quantizeGeometry(geom, decimals) {
  if (!geom) return null
  if (geom.type === 'Polygon') {
    const rings = geom.coordinates.map(r => quantizeRing(r, decimals)).filter(r => r.length >= 4)
    return rings.length ? { type: 'Polygon', coordinates: rings } : null
  }
  if (geom.type === 'MultiPolygon') {
    const polys = geom.coordinates
      .map(poly => poly.map(r => quantizeRing(r, decimals)).filter(r => r.length >= 4))
      .filter(poly => poly.length)
    return polys.length ? { type: 'MultiPolygon', coordinates: polys } : null
  }
  return geom
}

// Normalize one CGAZ ADM0 feature (keyed by alpha-3 `shapeGroup`) to the property names
// the client country layer reads (ISO_A2/ADM0_A3/NAME/ADMIN). Returns null for the CRS
// pseudo-entry or anything without a group/geometry.
function normalizeAdm0Feature(f) {
  const a3 = f.properties?.shapeGroup
  if (!a3) return null
  const name = f.properties?.shapeName || a3
  const geometry = quantizeGeometry(f.geometry, ADM0_DECIMALS)
  if (!geometry) return null
  return {
    type: 'Feature',
    properties: { ISO_A2: A3_TO_A2[a3] || null, ADM0_A3: a3, NAME: name, ADMIN: name },
    geometry,
  }
}

function normalizeAdm1(geo, a3, countryName) {
  if (!geo?.features) return []
  const a2 = A3_TO_A2[a3] || null
  // Ensure every region in a country ends up with a distinct iso_3166_2 — the Atlas
  // marks/unmarks regions by this code, so duplicates make one mark light up the whole
  // country.
  const used = new Set()
  const uniq = (base) => {
    let code = base, n = 2
    while (used.has(code)) code = `${base}-${n++}`
    used.add(code)
    return code
  }
  return geo.features.map(f => {
    const name = f.properties?.shapeName || ''
    const geometry = quantizeGeometry(f.geometry, ADM1_DECIMALS)
    if (!geometry) return null
    // shapeISO is a real ISO 3166-2 code for most features, but geoBoundaries sometimes
    // fills it with the bare country code instead of a subdivision code — e.g. every
    // Spanish region gets "ESP", every Chinese "CHN" (also CL/OM). Keep it only when it
    // is a real `XX-…` subdivision code and not already taken; otherwise synthesize a
    // stable, unique-per-country id from the region name so each region is independently
    // markable.
    const raw = f.properties?.shapeISO || ''
    let code
    if (/^[A-Za-z]{2}-[A-Za-z0-9]+$/.test(raw) && !used.has(raw)) {
      code = raw
      used.add(code)
    } else if (a2) {
      code = uniq(`${a2}-${name.replace(/[^A-Za-z0-9]/g, '').toUpperCase() || 'RGN'}`)
    } else {
      code = raw
    }
    return {
      type: 'Feature',
      // Property names the Atlas region layer + server getRegionGeo already read.
      properties: {
        iso_a2: a2,
        iso_3166_2: code,
        name,
        name_en: name,
        admin: countryName,
      },
      geometry,
    }
  }).filter(Boolean)
}

async function main() {
  console.log(`[atlas-geo] geoBoundaries ref ${GB_REF}; ${COUNTRIES.length} countries`)
  fs.mkdirSync(OUT_DIR, { recursive: true })
  fs.mkdirSync(CACHE_DIR, { recursive: true })

  // ADM0 (countries) — one comprehensive CGAZ file (large; cached). Also yields the
  // English country name (shapeGroup → shapeName) used for the ADM1 `admin` field.
  console.log('[atlas-geo] downloading CGAZ ADM0 (countries)…')
  const cgaz = await fetchGeo(CGAZ_ADM0)
  const adm0Features = []
  const a3ToName = {}
  for (const f of cgaz?.features || []) {
    const nf = normalizeAdm0Feature(f)
    if (nf) { a3ToName[nf.properties.ADM0_A3] = nf.properties.NAME; adm0Features.push(nf) }
  }

  // ADM1 (sub-national regions) — per-country gbOpen (carries ISO 3166-2 `shapeISO`).
  console.log('[atlas-geo] downloading ADM1 (regions)…')
  const adm1Raw = await pool(COUNTRIES, a3 => fetchGeo(MEDIA(a3, 'ADM1')))
  const adm1Features = []
  let withCodes = 0
  COUNTRIES.forEach((a3, idx) => {
    const feats = normalizeAdm1(adm1Raw[idx], a3, a3ToName[a3] || a3)
    for (const f of feats) if (f.properties.iso_3166_2) withCodes++
    adm1Features.push(...feats)
  })

  const write = (name, features) => {
    const fc = { type: 'FeatureCollection', features }
    const gz = zlib.gzipSync(Buffer.from(JSON.stringify(fc)), { level: 9 })
    const file = path.join(OUT_DIR, `${name}.geojson.gz`)
    fs.writeFileSync(file, gz)
    console.log(`[atlas-geo] wrote ${path.relative(path.join(__dirname, '..'), file)} — ${features.length} features, ${(gz.length / 1e6).toFixed(1)} MB gz`)
  }

  write('admin0', adm0Features)
  write('admin1', adm1Features)

  const missing1 = COUNTRIES.filter((a3, i) => !normalizeAdm1(adm1Raw[i], a3, '').length)
  console.log(`[atlas-geo] ADM0 country features: ${adm0Features.length}`)
  console.log(`[atlas-geo] ADM1 countries without regions (skipped/404): ${missing1.length}`)
  console.log(`[atlas-geo] ADM1 features with ISO 3166-2 code: ${withCodes}/${adm1Features.length}`)
}

main().catch(err => { console.error(err); process.exit(1) })
