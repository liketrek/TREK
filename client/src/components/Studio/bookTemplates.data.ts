import type { BookElement } from '@trek/shared'

/**
 * The spread templates, as data.
 *
 * ── Where these come from ────────────────────────────────────────────────
 *
 * Not from this file's author. They were built by hand in Studio and read back
 * out of the document — which is the point: what a page should look like is a
 * matter of taste, and taste is not something a layout function arrives at by
 * reasoning. The editor is the design tool, and this is its output.
 *
 * To add one: build the spread in Studio, then run
 *
 *     node scripts/extract-templates.cjs <journeyId>
 *
 * from server/ and commit what it writes here.
 *
 * ── Why the numbers are fractions ────────────────────────────────────────
 *
 * Every frame is divided by the page it was drawn on — x and w by one page's
 * width, y and h by its height — and type sizes by the page height. A template
 * built on a 210mm square therefore lays out on an A4 landscape book without
 * being redrawn, which it would otherwise have to be for every trim size the
 * picker offers.
 *
 * ── What gets filled in ──────────────────────────────────────────────────
 *
 * Elements carrying a `binding` take their text from the entry; empty photo
 * frames take its photographs in order; the day, coordinate and country marks
 * take what the entry knows about its stop. Everything else — the panels, the
 * rules, the shapes that run off the page — is the design, and is kept as it
 * was drawn.
 */

export interface SpreadTemplate {
  id: string
  background: string | null
  /** Frames and sizes are fractions — see the note above. */
  elements: BookElement[]
}

export const SPREAD_TEMPLATES: SpreadTemplate[] = [
  {
    id: 'ref-1',
    background: null,
    elements: [
          {
                "id": "p-flxgo8u",
                "frame": {
                      "x": 0.0238,
                      "y": 0.0238,
                      "w": 0.9524,
                      "h": 0.9524
                },
                "rotation": 0,
                "opacity": 1,
                "locked": false,
                "kind": "photo",
                "photoId": null,
                "fit": "cover",
                "focalX": 0.5,
                "focalY": 0.5,
                "radius": 0,
                "filter": "none",
                "mask": null,
                "frameStyle": "none"
          },
          {
                "id": "s-iqku6eo",
                "frame": {
                      "x": 1.5898,
                      "y": 0.0238,
                      "w": 0.3864,
                      "h": 0.9524
                },
                "rotation": 0,
                "opacity": 1,
                "locked": false,
                "kind": "shape",
                "shape": "rect",
                "fill": "#11224f",
                "gradient": "none",
                "stroke": null,
                "strokeWidth": 0,
                "strokeStyle": "solid",
                "radius": 0
          },
          {
                "id": "t-nszckjj",
                "frame": {
                      "x": 1.5898,
                      "y": 0.0563,
                      "w": 0.3864,
                      "h": 0.0613
                },
                "rotation": 0,
                "opacity": 1,
                "locked": false,
                "kind": "text",
                "text": "COUNTRIES",
                "font": "sans",
                "size": 0.1429,
                "weight": 700,
                "italic": false,
                "align": "center",
                "leading": 1.1,
                "tracking": -0.02,
                "color": "#ffffff",
                "binding": null,
                "overridden": true
          },
          {
                "id": "t-6ntyuak",
                "frame": {
                      "x": 1.1136,
                      "y": 0.0563,
                      "w": 0.3864,
                      "h": 0.0613
                },
                "rotation": 0,
                "opacity": 1,
                "locked": false,
                "kind": "text",
                "text": "SUMMARY",
                "font": "sans",
                "size": 0.1429,
                "weight": 700,
                "italic": false,
                "align": "center",
                "leading": 1.1,
                "tracking": -0.02,
                "color": "#111111",
                "binding": null,
                "overridden": true
          },
          {
                "id": "s-v58hbqa",
                "frame": {
                      "x": 1.0812,
                      "y": 0.1757,
                      "w": 0.4511,
                      "h": 0.5743
                },
                "rotation": 0,
                "opacity": 1,
                "locked": false,
                "font": "sans",
                "color": "#1a1a1a",
                "accent": "#111111",
                "textScale": 1.2,
                "weight": 700,
                "stale": false,
                "kind": "stats",
                "metrics": [
                      "distance",
                      "days",
                      "steps",
                      "photos",
                      "countries",
                      "places"
                ],
                "layout": "grid",
                "showIcons": true,
                "units": "metric",
                "values": {
                      "distance": 352677,
                      "days": 1,
                      "steps": 2,
                      "photos": 0,
                      "countries": 2,
                      "places": 0,
                      "furthest": 352677
                }
          },
          {
                "id": "b-u0di1u7",
                "frame": {
                      "x": 1.1768,
                      "y": 0.7603,
                      "w": 0.26,
                      "h": 0.066
                },
                "rotation": 0,
                "opacity": 1,
                "locked": false,
                "font": "sans",
                "color": "#1a1a1a",
                "accent": "#111111",
                "textScale": 1,
                "weight": 700,
                "stale": false,
                "kind": "badge",
                "autoColor": true,
                "variant": "distance",
                "text": "0 km",
                "sub": "Distance",
                "code": null,
                "style": "chip"
          },
          {
                "id": "c-roas8tw",
                "frame": {
                      "x": 1.628,
                      "y": 0.2397,
                      "w": 0.31,
                      "h": 0.537
                },
                "rotation": 0,
                "opacity": 1,
                "locked": false,
                "font": "sans",
                "color": "#ffffff",
                "accent": "#ffffff",
                "textScale": 0.7,
                "weight": 700,
                "stale": false,
                "kind": "countries",
                "codes": [
                      "DE",
                      "NL"
                ],
                "names": [
                      "Germany",
                      "Netherlands"
                ],
                "layout": "list",
                "showOutline": true,
                "showFlag": false,
                "showName": true,
                "align": "center"
          }
    ],
  },
  {
    id: 'ref-2',
    background: null,
    elements: [
          {
                "id": "s-f7yltlr",
                "frame": {
                      "x": -0.1277,
                      "y": 0.6775,
                      "w": 0.5595,
                      "h": 0.5973
                },
                "rotation": 0,
                "opacity": 1,
                "locked": false,
                "kind": "shape",
                "shape": "flower-5",
                "fill": "#11254c",
                "gradient": "none",
                "stroke": null,
                "strokeWidth": 0,
                "strokeStyle": "solid",
                "radius": 0
          },
          {
                "id": "s-0fpxqfa",
                "frame": {
                      "x": 1.0762,
                      "y": 0.6437,
                      "w": 0.8635,
                      "h": 0.2829
                },
                "rotation": 0,
                "opacity": 1,
                "locked": false,
                "kind": "shape",
                "shape": "rect",
                "fill": "#11224f",
                "gradient": "none",
                "stroke": "#11224f",
                "strokeWidth": 0.0024,
                "strokeStyle": "solid",
                "radius": 0
          },
          {
                "id": "p-b5dnke1",
                "frame": {
                      "x": 0.0238,
                      "y": 0.0238,
                      "w": 1.9524,
                      "h": 0.3062
                },
                "rotation": 0,
                "opacity": 1,
                "locked": false,
                "kind": "photo",
                "photoId": null,
                "fit": "cover",
                "focalX": 0.5,
                "focalY": 0.5,
                "radius": 0,
                "filter": "none",
                "mask": null,
                "frameStyle": "none"
          },
          {
                "id": "t-kvtn36a",
                "frame": {
                      "x": 0.0762,
                      "y": 0.3843,
                      "w": 0.8476,
                      "h": 0.0479
                },
                "rotation": 0,
                "opacity": 1,
                "locked": false,
                "kind": "text",
                "text": "TEST1",
                "font": "sans",
                "size": 0.1048,
                "weight": 700,
                "italic": false,
                "align": "left",
                "leading": 1.1,
                "tracking": -0.02,
                "color": "#1a1a1a",
                "binding": {
                      "source": "entry.title",
                      "entryId": 62
                },
                "overridden": false
          },
          {
                "id": "t-cnhlrmk",
                "frame": {
                      "x": 0.0762,
                      "y": 0.452,
                      "w": 0.8476,
                      "h": 0.1917
                },
                "rotation": 0,
                "opacity": 1,
                "locked": false,
                "kind": "text",
                "text": "Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.",
                "font": "sans",
                "size": 0.0476,
                "weight": 400,
                "italic": false,
                "align": "left",
                "leading": 1.55,
                "tracking": 0,
                "color": "#1a1a1a",
                "binding": {
                      "source": "entry.story",
                      "entryId": 62
                },
                "overridden": false
          },
          {
                "id": "li-w82p1lh",
                "frame": {
                      "x": 1.1161,
                      "y": 0.6769,
                      "w": 0.7837,
                      "h": 0.0731
                },
                "rotation": 0,
                "opacity": 1,
                "locked": false,
                "font": "sans",
                "color": "#ffffff",
                "accent": "#ffffff",
                "textScale": 1,
                "weight": 700,
                "stale": false,
                "kind": "list",
                "items": [
                      {
                            "text": "TEST1",
                            "tone": "pro"
                      },
                      {
                            "text": "TEST1",
                            "tone": "con"
                      }
                ],
                "layout": "columns",
                "showMarks": true,
                "proLabel": "PROS",
                "conLabel": "Cons"
          },
          {
                "id": "t-gabkf9x",
                "frame": {
                      "x": 1.0762,
                      "y": 0.3843,
                      "w": 0.8476,
                      "h": 0.1917
                },
                "rotation": 0,
                "opacity": 1,
                "locked": false,
                "kind": "text",
                "text": "Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.",
                "font": "sans",
                "size": 0.0476,
                "weight": 400,
                "italic": false,
                "align": "left",
                "leading": 1.55,
                "tracking": 0,
                "color": "#1a1a1a",
                "binding": {
                      "source": "entry.story",
                      "entryId": 62
                },
                "overridden": false
          },
          {
                "id": "s-vkl7noe",
                "frame": {
                      "x": 1.0762,
                      "y": 0.6034,
                      "w": 0.5,
                      "h": 0.0024
                },
                "rotation": 0,
                "opacity": 1,
                "locked": false,
                "kind": "shape",
                "shape": "rect",
                "fill": "#141414",
                "gradient": "none",
                "stroke": null,
                "strokeWidth": 0,
                "strokeStyle": "solid",
                "radius": 0
          },
          {
                "id": "p-s3anbzj",
                "frame": {
                      "x": 0.1836,
                      "y": 0.7134,
                      "w": 0.2,
                      "h": 0.2171
                },
                "rotation": 0,
                "opacity": 1,
                "locked": false,
                "kind": "photo",
                "photoId": null,
                "fit": "cover",
                "focalX": 0.5,
                "focalY": 0.5,
                "radius": 0,
                "filter": "none",
                "mask": null,
                "frameStyle": "polaroid"
          },
          {
                "id": "p-874qk6j",
                "frame": {
                      "x": 0.5893,
                      "y": 0.7134,
                      "w": 0.2,
                      "h": 0.2171
                },
                "rotation": 0,
                "opacity": 1,
                "locked": false,
                "kind": "photo",
                "photoId": null,
                "fit": "cover",
                "focalX": 0.5,
                "focalY": 0.5,
                "radius": 0,
                "filter": "none",
                "mask": null,
                "frameStyle": "polaroid"
          },
          {
                "id": "b-ga9zv0w",
                "frame": {
                      "x": 0.0399,
                      "y": 0.041,
                      "w": 0.17,
                      "h": 0.062
                },
                "rotation": 0,
                "opacity": 1,
                "locked": false,
                "font": "sans",
                "color": "#1a1a1a",
                "accent": "#111111",
                "textScale": 1,
                "weight": 700,
                "stale": false,
                "kind": "badge",
                "autoColor": true,
                "variant": "day",
                "text": "DAY 1",
                "sub": "",
                "code": null,
                "style": "chip"
          },
          {
                "id": "b-gmtenyt",
                "frame": {
                      "x": 0.5993,
                      "y": 0.8893,
                      "w": 0.18,
                      "h": 0.05
                },
                "rotation": 0,
                "opacity": 1,
                "locked": false,
                "font": "sans",
                "color": "#1a1a1a",
                "accent": "#111111",
                "textScale": 1.2,
                "weight": 700,
                "stale": false,
                "kind": "badge",
                "autoColor": true,
                "variant": "coords",
                "text": "51°10'N 10°27'E",
                "sub": "",
                "code": null,
                "style": "plain"
          },
          {
                "id": "b-4rd95kg",
                "frame": {
                      "x": 0.1936,
                      "y": 0.8893,
                      "w": 0.18,
                      "h": 0.05
                },
                "rotation": 0,
                "opacity": 1,
                "locked": false,
                "font": "sans",
                "color": "#1a1a1a",
                "accent": "#111111",
                "textScale": 1.2,
                "weight": 700,
                "stale": false,
                "kind": "badge",
                "autoColor": true,
                "variant": "coords",
                "text": "51°10'N 10°27'E",
                "sub": "",
                "code": null,
                "style": "plain"
          }
    ],
  },
]
