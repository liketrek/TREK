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
                "id": "p-iy13loy",
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
                "focalX": 0.572289143475242,
                "focalY": 0.5726791042512355,
                "radius": 0.0238,
                "filter": "none",
                "mask": null,
                "frameStyle": "none"
          },
          {
                "id": "s-kafy6t4",
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
                "fill": "#111111",
                "gradient": "none",
                "stroke": null,
                "strokeWidth": 0,
                "strokeStyle": "solid",
                "radius": 0
          },
          {
                "id": "t-v4jhfu6",
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
                "id": "t-nh804rp",
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
                "id": "s-8c3kwzk",
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
                "textScale": 1.5,
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
                      "photos": 3,
                      "countries": 2,
                      "places": 0,
                      "furthest": 352677
                }
          },
          {
                "id": "b-15vswaz",
                "frame": {
                      "x": 1.1768,
                      "y": 0.7685,
                      "w": 0.2587,
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
                "variant": "distance",
                "text": "0 km",
                "sub": "Distance",
                "code": null,
                "style": "chip",
                "autoColor": true,
                "showIcon": true,
                "showLabel": true,
                "autoIconColor": true,
                "iconColor": "#111111"
          },
          {
                "id": "c-jdsxmvn",
                "frame": {
                      "x": 1.628,
                      "y": 0.2315,
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
                      "x": -0.1264,
                      "y": 0.6775,
                      "w": 0.5595,
                      "h": 0.5973
                },
                "rotation": 0,
                "opacity": 1,
                "locked": false,
                "kind": "shape",
                "shape": "flower-5",
                "fill": "#111111",
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
                "fill": "#111111",
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
                "photoId": 69,
                "fit": "cover",
                "focalX": 0.42168673729754674,
                "focalY": 0.23833399057977409,
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
                "text": "Lorem ipsum dolor sit amet",
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
                "photoId": 68,
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
                "photoId": 69,
                "fit": "cover",
                "focalX": 0.5,
                "focalY": 0.5,
                "radius": 0,
                "filter": "none",
                "mask": "heart",
                "frameStyle": "polaroid"
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
                "variant": "coords",
                "text": "51°10'N 10°27'E",
                "sub": "",
                "code": null,
                "style": "plain",
                "autoColor": true,
                "showIcon": true,
                "showLabel": true,
                "autoIconColor": true,
                "iconColor": "#111111"
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
                "variant": "coords",
                "text": "51°10'N 10°27'E",
                "sub": "",
                "code": null,
                "style": "plain",
                "autoColor": true,
                "showIcon": true,
                "showLabel": true,
                "autoIconColor": true,
                "iconColor": "#111111"
          }
    ],
  },
  {
    id: 'ref-3',
    background: null,
    elements: [
          {
                "id": "p-sa5cabi",
                "frame": {
                      "x": 0.025,
                      "y": 0.025,
                      "w": 1.9512,
                      "h": 0.5919
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
                "id": "t-kws7inb",
                "frame": {
                      "x": 0.054,
                      "y": 0.688,
                      "w": 0.8919,
                      "h": 0.2294
                },
                "rotation": 0,
                "opacity": 1,
                "locked": false,
                "kind": "text",
                "text": "Lorem ipsum dolor sit amet",
                "font": "sans",
                "size": 0.2381,
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
                "id": "t-1zzydde",
                "frame": {
                      "x": 1.0808,
                      "y": 0.6542,
                      "w": 0.8385,
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
                "id": "t-kht4sfu",
                "frame": {
                      "x": 0.054,
                      "y": 0.6542,
                      "w": 0.36,
                      "h": 0.0314
                },
                "rotation": 0,
                "opacity": 1,
                "locked": false,
                "kind": "text",
                "text": "August 19, 2026",
                "font": "sans",
                "size": 0.0762,
                "weight": 700,
                "italic": false,
                "align": "left",
                "leading": 1.1,
                "tracking": -0.02,
                "color": "#1a1a1a",
                "binding": {
                      "source": "entry.date",
                      "entryId": 62,
                      "value": "2026-08-19"
                },
                "overridden": false
          }
    ],
  },
  {
    id: 'ref-4',
    background: null,
    elements: [
          {
                "id": "s-19c5q0x",
                "frame": {
                      "x": -0.1119,
                      "y": 0.4164,
                      "w": 0.7143,
                      "h": 0.7143
                },
                "rotation": 0,
                "opacity": 1,
                "locked": false,
                "kind": "shape",
                "shape": "ellipse",
                "fill": "#141414",
                "gradient": "none",
                "stroke": null,
                "strokeWidth": 0,
                "strokeStyle": "solid",
                "radius": 0
          },
          {
                "id": "p-e8ee9j8",
                "frame": {
                      "x": 0.0816,
                      "y": 0.0763,
                      "w": 0.3367,
                      "h": 0.3827
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
                "id": "p-fimcc5x",
                "frame": {
                      "x": 0.5662,
                      "y": 0.202,
                      "w": 0.3367,
                      "h": 0.3827
                },
                "rotation": -10.1,
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
                "id": "p-nva57q1",
                "frame": {
                      "x": 0.1739,
                      "y": 0.5,
                      "w": 0.3367,
                      "h": 0.3827
                },
                "rotation": 5.1,
                "opacity": 1,
                "locked": false,
                "kind": "photo",
                "photoId": null,
                "fit": "cover",
                "focalX": 0.5,
                "focalY": 0.5,
                "radius": 0,
                "filter": "none",
                "mask": "seal",
                "frameStyle": "polaroid"
          },
          {
                "id": "t-7zfrwms",
                "frame": {
                      "x": 1.0762,
                      "y": 0.1605,
                      "w": 0.8476,
                      "h": 0.0895
                },
                "rotation": 0,
                "opacity": 1,
                "locked": false,
                "kind": "text",
                "text": "Lorem ipsum dolor sit amet",
                "font": "sans",
                "size": 0.1429,
                "weight": 700,
                "italic": false,
                "align": "left",
                "leading": 1.1,
                "tracking": -0.02,
                "color": "#1a1a1a",
                "binding": {
                      "source": "entry.title",
                      "entryId": 63
                },
                "overridden": false
          },
          {
                "id": "t-culm58m",
                "frame": {
                      "x": 1.0762,
                      "y": 0.2676,
                      "w": 0.8476,
                      "h": 0.2073
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
                "id": "li-dukbgme",
                "frame": {
                      "x": 1.0762,
                      "y": 0.5116,
                      "w": 0.72,
                      "h": 0.0731
                },
                "rotation": 0,
                "opacity": 1,
                "locked": false,
                "font": "sans",
                "color": "#1a1a1a",
                "accent": "#c2410c",
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
                "proLabel": "Pros",
                "conLabel": "Cons"
          },
          {
                "id": "t-x3ysuxa",
                "frame": {
                      "x": 1.0762,
                      "y": 0.116,
                      "w": 0.36,
                      "h": 0.0314
                },
                "rotation": 0,
                "opacity": 1,
                "locked": false,
                "kind": "text",
                "text": "August 19, 2026",
                "font": "sans",
                "size": 0.069,
                "weight": 700,
                "italic": false,
                "align": "left",
                "leading": 1.1,
                "tracking": -0.02,
                "color": "#1a1a1a",
                "binding": {
                      "source": "entry.date",
                      "entryId": 62,
                      "value": "2026-08-19"
                },
                "overridden": false
          }
    ],
  },
  {
    id: 'ref-5',
    background: null,
    elements: [
          {
                "id": "p-adrg53f",
                "frame": {
                      "x": 0.025,
                      "y": 0.025,
                      "w": 0.475,
                      "h": 0.9512
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
                "id": "t-crm4sem",
                "frame": {
                      "x": 0.5297,
                      "y": 0.119,
                      "w": 0.4258,
                      "h": 0.8012
                },
                "rotation": 0,
                "opacity": 1,
                "locked": false,
                "kind": "text",
                "text": "Lorem ipsum dolor sit amet",
                "font": "sans",
                "size": 0.2381,
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
                "id": "s-3dhohc7",
                "frame": {
                      "x": 1.0762,
                      "y": 0.3541,
                      "w": 0.5,
                      "h": 0.0024
                },
                "rotation": 0,
                "opacity": 1,
                "locked": false,
                "kind": "shape",
                "shape": "rect",
                "fill": "#f2f2f2",
                "gradient": "none",
                "stroke": "#141414",
                "strokeWidth": 0.0005,
                "strokeStyle": "solid",
                "radius": 0
          },
          {
                "id": "t-0l6zeg7",
                "frame": {
                      "x": 1.0762,
                      "y": 0.119,
                      "w": 0.8346,
                      "h": 0.2047
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
                "id": "p-igt1irs",
                "frame": {
                      "x": 1.0762,
                      "y": 0.4469,
                      "w": 0.368,
                      "h": 0.2495
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
                "frameStyle": "shadow"
          },
          {
                "id": "p-2akhm3w",
                "frame": {
                      "x": 1.5105,
                      "y": 0.4469,
                      "w": 0.368,
                      "h": 0.2495
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
                "frameStyle": "shadow"
          },
          {
                "id": "bd-g6o9fvm",
                "frame": {
                      "x": 0.53,
                      "y": 0.4577,
                      "w": 0.2604,
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
                "variant": "weather",
                "text": "Partly cloudy",
                "sub": "",
                "code": "partly",
                "style": "chip",
                "autoColor": true,
                "showIcon": true,
                "showLabel": true,
                "autoIconColor": false,
                "iconColor": "#ffffff"
          },
          {
                "id": "bd-ewxvw6v",
                "frame": {
                      "x": 0.53,
                      "y": 0.5406,
                      "w": 0.2607,
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
                "variant": "mood",
                "text": "Amazing",
                "sub": "",
                "code": "amazing",
                "style": "chip",
                "autoColor": true,
                "showIcon": true,
                "showLabel": true,
                "autoIconColor": false,
                "iconColor": "#ffffff"
          },
          {
                "id": "t-az8f0nc",
                "frame": {
                      "x": 0.5297,
                      "y": 0.0858,
                      "w": 0.36,
                      "h": 0.0347
                },
                "rotation": 0,
                "opacity": 1,
                "locked": false,
                "kind": "text",
                "text": "August 19, 2026",
                "font": "sans",
                "size": 0.0714,
                "weight": 700,
                "italic": false,
                "align": "left",
                "leading": 1.1,
                "tracking": -0.02,
                "color": "#1a1a1a",
                "binding": {
                      "source": "entry.date",
                      "entryId": 62,
                      "value": "2026-08-19"
                },
                "overridden": false
          }
    ],
  },
  {
    id: 'ref-6',
    background: null,
    elements: [
          {
                "id": "s-7go39mg",
                "frame": {
                      "x": 0.0238,
                      "y": 0.309,
                      "w": 0.9524,
                      "h": 0.666
                },
                "rotation": 0,
                "opacity": 1,
                "locked": false,
                "kind": "shape",
                "shape": "triangle",
                "fill": "#141414",
                "gradient": "none",
                "stroke": null,
                "strokeWidth": 0,
                "strokeStyle": "solid",
                "radius": 0
          },
          {
                "id": "p-a9065nh",
                "frame": {
                      "x": 0.0238,
                      "y": 0.0238,
                      "w": 0.2745,
                      "h": 0.9512
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
                "id": "p-fvcm5kq",
                "frame": {
                      "x": 0.3628,
                      "y": 0.0914,
                      "w": 0.2745,
                      "h": 0.8848
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
                "id": "p-aski19e",
                "frame": {
                      "x": 0.7017,
                      "y": 0.0238,
                      "w": 0.2745,
                      "h": 0.9512
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
                "id": "p-tfs5cdi",
                "frame": {
                      "x": 1.0238,
                      "y": 0.0238,
                      "w": 0.9524,
                      "h": 0.45
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
                "id": "t-9zjrvsn",
                "frame": {
                      "x": 1.0592,
                      "y": 0.5,
                      "w": 0.8476,
                      "h": 0.0518
                },
                "rotation": 0,
                "opacity": 1,
                "locked": false,
                "kind": "text",
                "text": "Lorem ipsum dolor sit amet",
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
                "id": "t-4lgyrab",
                "frame": {
                      "x": 1.0592,
                      "y": 0.5682,
                      "w": 0.8476,
                      "h": 0.1995
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
                "id": "li-93gcznw",
                "frame": {
                      "x": 1.0592,
                      "y": 0.7876,
                      "w": 0.72,
                      "h": 0.0731
                },
                "rotation": 0,
                "opacity": 1,
                "locked": false,
                "font": "sans",
                "color": "#1a1a1a",
                "accent": "#c2410c",
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
                "proLabel": "Pros",
                "conLabel": "Cons"
          }
    ],
  },
]
