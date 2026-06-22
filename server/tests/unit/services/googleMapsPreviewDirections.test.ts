import {
  __clearGoogleMapsPreviewDirectionsCacheForTests,
  buildGoogleMapsPreviewDirectionsUrl,
  fetchGoogleMapsPreviewDirections,
  parseGoogleMapsPreviewDirectionsResponse,
} from '../../../src/services/googleMapsPreviewDirections';

import { afterEach, describe, expect, it, vi } from 'vitest';

const origin = { label: 'University of Waterloo', lat: 43.4722854, lng: -80.5448576 };
const destination = { label: 'Royal Ontario Museum', lat: 43.6677097, lng: -79.3947771 };

function sampleResponse(): string {
  const tollAdvisory: unknown[] = [];
  tollAdvisory[1] = 'This route has tolls.';
  tollAdvisory[8] = 2;
  tollAdvisory[14] = [
    null,
    null,
    null,
    null,
    [['//maps.gstatic.com/mapfiles/directions/advisory/svg/toll2.svg', 1, [64, 64], null, 0]],
  ];
  const header: unknown[] = [];
  header[0] = 0;
  header[1] = 'ON-401 E';
  header[2] = [119992, '120 km', 0];
  header[3] = [5162, '1 hr 26 min'];
  header[9] = [tollAdvisory];
  header[10] = [
    [5100, '1 hr 25 min'],
    null,
    3,
    [4635, '1 hr 17 min'],
    [4500, 6000, '1 hr 15 min to 1 hr 40 min'],
    [5100],
    null,
    [1782090600, 'America/Toronto', '9:10 PM', -14400, 1782090600],
  ];
  const step = [
    [
      null,
      "<step maneuver='DEPART' meters='497'>Head <direction dir='SOUTH'>south</direction></step>",
      [500, '500 m'],
      [42, '42 sec'],
    ],
  ];
  const leg = [[null, null, [3500, '3.5 km'], [360, '6 min']], [step]];
  const trafficEvent: unknown[] = [];
  const trafficEventDetails: unknown[] = [];
  trafficEvent[8] = 13;
  trafficEvent[14] = [
    0,
    null,
    null,
    null,
    [['//maps.gstatic.com/mapfiles/traffic/svg/accident_card_v2.svg', 1, null, null, 0]],
  ];
  trafficEvent[19] = [[2, ['Crash']]];
  trafficEvent[20] = [[2, ['11-min delay, likely to change']]];
  trafficEventDetails[0] = [660, '11 mins delay'];
  trafficEventDetails[1] = [1345494, '1,345 km', 0];
  trafficEventDetails[8] = [5905, 'Reported 1 hr 38 mins ago'];
  trafficEventDetails[10] = [275, 'Updated 4 mins ago'];
  trafficEventDetails[18] = [2, ['Crash']];
  trafficEventDetails[24] = [1782081500, null, 'Updated 4 mins ago'];
  trafficEvent[21] = trafficEventDetails;
  const route: unknown[] = [header, [[null, [leg]]]];
  route[3] = [null, null, 3, [trafficEvent]];
  const geometry = [
    [
      [434826999, -1317],
      [-805547108, 537],
    ],
  ];
  return `)]}'\n${JSON.stringify([[null, [route], null, null, null, null, null, geometry]])}`;
}

function sampleJapanTransitResponse(): string {
  const fare = [180, 'JPY 180', 'JPY'];
  const agency = [
    'East Japan Railway',
    '2344117457353804682',
    null,
    null,
    null,
    null,
    null,
    ['https://www.jreast.co.jp/'],
  ];
  const departure = [1782091860, 'Asia/Tokyo', '10:31 AM', 32400, 1782091860];
  const arrival = [1782092640, 'Asia/Tokyo', '10:44 AM', 32400, 1782092640];
  const stopIcon = [
    3,
    'jp-stop-icons/jr-east/JY/25.png',
    null,
    null,
    [['//maps.gstatic.com/mapfiles/transit/iw2/svg/jp-stop-icons/jr-east/JY/25.svg', 1, [44, 44], null, 0]],
  ];
  const lineIcon = [
    3,
    'jp2ltr/JY.png',
    null,
    'Train',
    [['//maps.gstatic.com/mapfiles/transit/iw2/svg/jp2ltr/JY.svg', 1, [44, 44], null, 0]],
  ];
  const transitSummary = [
    [5, null, lineIcon],
    [5, ['Yamanote Line', 1, '#73c11d', '#000000']],
    [15, ['Local']],
    [7, ['For Shibuya / Shinjuku (Clockwise)']],
  ];
  const header: unknown[] = [];
  header[0] = 3;
  header[2] = [1000, '1 km', 0];
  header[3] = [780, '13 min', 780];
  header[5] = [departure, arrival];
  header[6] = [null, null, null, null, [agency]];
  header[11] = fare;
  header[14] = transitSummary;

  const departureStop: unknown[] = [
    'Shinagawa Station',
    'JY25',
    null,
    departure,
    [null, null, 35.6282921, 139.7385583],
    '3',
    '0x60188a5a6e148775:0x9a45c347f706db70',
  ];
  departureStop[15] = stopIcon;
  const arrivalStop: unknown[] = [
    'Shibuya Station',
    'JY20',
    arrival,
    null,
    [null, null, 35.6581809, 139.7015378],
    '1',
    '0x60188b563b00109f:0x337328def1e2ab26',
  ];
  arrivalStop[15] = [
    3,
    'jp-stop-icons/jr-east/JY/20.png',
    null,
    null,
    [['//maps.gstatic.com/mapfiles/transit/iw2/svg/jp-stop-icons/jr-east/JY/20.svg', 1, [44, 44], null, 0]],
  ];
  const intermediateStop: unknown[] = [
    'Osaki Station',
    'JY24',
    [1782092040, 'Asia/Tokyo', '10:34 AM', 32400, 1782092040],
    [1782092100, 'Asia/Tokyo', '10:35 AM', 32400, 1782092100],
    [null, null, 35.6198434, 139.7283077],
    '3/4',
    '0x60188af43b9fc7f5:0xc9cec030c12bcf76',
  ];
  intermediateStop[15] = [
    3,
    'jp-stop-icons/jr-east/JY/24.png',
    null,
    null,
    [['//maps.gstatic.com/mapfiles/transit/iw2/svg/jp-stop-icons/jr-east/JY/24.svg', 1, [44, 44], null, 0]],
  ];
  const transitDetail: unknown[] = [];
  transitDetail[0] = departureStop;
  transitDetail[1] = arrivalStop;
  transitDetail[2] = 5;
  transitDetail[3] = '#73c11d';
  transitDetail[5] = ['L', 'Local'];
  transitDetail[7] = [intermediateStop];
  transitDetail[22] = [4, null, lineIcon];
  const leg: unknown[] = [header, []];
  leg[5] = transitDetail;
  const route: unknown[] = [header, [[null, [leg]]]];
  return `)]}'\n${JSON.stringify([[null, [route]]])}`;
}

afterEach(() => {
  vi.unstubAllGlobals();
  __clearGoogleMapsPreviewDirectionsCacheForTests();
});

describe('googleMapsPreviewDirections wrapper', () => {
  it('builds compact pb for each supported route mode', () => {
    expect(buildGoogleMapsPreviewDirectionsUrl({ origin, destination, mode: 'driving' }).pb).toContain('!20m5!1e0');
    expect(buildGoogleMapsPreviewDirectionsUrl({ origin, destination, mode: 'bicycling' }).pb).toContain('!20m5!1e1');
    expect(buildGoogleMapsPreviewDirectionsUrl({ origin, destination, mode: 'walking' }).pb).toContain('!20m5!1e2');
    expect(buildGoogleMapsPreviewDirectionsUrl({ origin, destination, mode: 'transit' }).pb).toContain('!20m5!1e3');
  });

  it('encodes Google Maps avoid options in the full feature block', () => {
    const built = buildGoogleMapsPreviewDirectionsUrl({
      origin,
      destination,
      avoidTolls: true,
      avoidHighways: true,
      avoidFerries: true,
    });

    expect(built.featureProfile).toBe('full');
    expect(built.pb).toContain('!6m60');
    expect(built.pb).toContain('!2m6!1b1!2b1!5m1');
    expect(built.pb).toContain('!6m26');
    expect(built.pb).toContain('!279b1!7b1!10b1');
  });

  it('encodes absolute departure instants as Google local-wall-clock epochs', () => {
    const built = buildGoogleMapsPreviewDirectionsUrl({
      origin,
      destination,
      time: {
        kind: 'departAt',
        // 2026-06-21 23:30:00 UTC is 2026-06-21 19:30:00 in Toronto.
        epochSeconds: 1782084600,
        timeZone: 'America/Toronto',
      },
    });
    expect(built.pb).toContain('!19m2!2e2!3j1782070200');
    expect(built.googleMapsEpochSeconds).toBe(1782070200);
  });

  it('switches to the full feature profile when overview geometry is requested', () => {
    const built = buildGoogleMapsPreviewDirectionsUrl({
      origin,
      destination,
      includeOverviewGeometry: true,
    });
    expect(built.featureProfile).toBe('full');
    expect(built.pb).toContain('!6m57');
    expect(built.pb).toContain('!20m28');
  });

  it('parses route summaries, traffic, warnings, steps and decoded overview geometry', () => {
    const result = parseGoogleMapsPreviewDirectionsResponse(sampleResponse(), {
      origin,
      destination,
      includeOverviewGeometry: true,
    });
    expect(result.routes).toHaveLength(1);
    expect(result.routes[0]).toMatchObject({
      mode: 'driving',
      title: 'ON-401 E',
      distance: { meters: 119992, text: '120 km' },
      duration: { seconds: 5162, text: '1 hr 26 min' },
      warnings: ['This route has tolls.'],
      advisories: [
        {
          text: 'This route has tolls.',
          code: 2,
          kind: 'toll',
          iconUrls: ['https://maps.gstatic.com/mapfiles/directions/advisory/svg/toll2.svg'],
        },
      ],
    });
    expect(result.routes[0].traffic?.duration).toEqual({ seconds: 5100, text: '1 hr 25 min' });
    expect(result.routes[0].traffic?.arrivalTime?.text).toBe('9:10 PM');
    expect(result.routes[0].trafficEvents[0]).toMatchObject({
      type: 'Crash',
      title: 'Crash',
      description: '11-min delay, likely to change',
      typeCode: 13,
      delay: { seconds: 660, text: '11 mins delay' },
      distance: { meters: 1345494, text: '1,345 km' },
      reportedAgo: { seconds: 5905, text: 'Reported 1 hr 38 mins ago' },
      updatedAgo: { seconds: 275, text: 'Updated 4 mins ago' },
      updatedTime: { epochSeconds: 1782081500, text: 'Updated 4 mins ago' },
      iconUrls: ['https://maps.gstatic.com/mapfiles/traffic/svg/accident_card_v2.svg'],
    });
    expect(result.routes[0].legs[0].steps[0]).toMatchObject({
      instructionText: 'Head south',
      maneuver: 'DEPART',
      distance: { meters: 500, text: '500 m' },
    });
    expect(result.routes[0].overviewGeometry?.[0]).toEqual({ lat: 43.4826999, lng: -80.5547108 });
  });

  it('parses Japan transit fares, rail line metadata, platforms, stop codes and stop icons', () => {
    const result = parseGoogleMapsPreviewDirectionsResponse(sampleJapanTransitResponse(), {
      origin,
      destination,
      mode: 'transit',
    });
    const route = result.routes[0];
    const leg = route.legs[0];
    expect(route.fare).toEqual({ amount: 180, text: 'JPY 180', currency: 'JPY' });
    expect(route.transitAgencies[0]).toMatchObject({
      name: 'East Japan Railway',
      website: 'https://www.jreast.co.jp/',
    });
    expect(leg.fare).toEqual({ amount: 180, text: 'JPY 180', currency: 'JPY' });
    expect(leg.departureTime?.timeZone).toBe('Asia/Tokyo');
    expect(leg.transit).toMatchObject({
      lineName: 'Yamanote Line',
      serviceName: 'Local',
      serviceShortName: 'Local',
      headsign: 'For Shibuya / Shinjuku (Clockwise)',
      vehicleType: 'Train',
      color: '#73c11d',
      textColor: '#000000',
      stopCount: 5,
      agencies: [{ name: 'East Japan Railway' }],
      departureStop: {
        name: 'Shinagawa Station',
        stationCode: 'JY25',
        platform: '3',
        lat: 35.6282921,
        lng: 139.7385583,
      },
      arrivalStop: {
        name: 'Shibuya Station',
        stationCode: 'JY20',
        platform: '1',
      },
      intermediateStops: [
        {
          name: 'Osaki Station',
          stationCode: 'JY24',
          platform: '3/4',
        },
      ],
    });
    expect(leg.transit?.vehicleIcon?.urls).toEqual(['https://maps.gstatic.com/mapfiles/transit/iw2/svg/jp2ltr/JY.svg']);
    expect(leg.transit?.departureStop?.icon?.name).toBe('jp-stop-icons/jr-east/JY/25.png');
  });

  it('fetches the fixed Google endpoint and normalizes the parsed response', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: async () => sampleResponse(),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchGoogleMapsPreviewDirections({ origin, destination, includeDebug: true });
    expect(result.source).toBe('google-preview-directions');
    expect(result.routes[0].title).toBe('ON-401 E');
    expect(result.debug?.url).toContain('https://www.google.com/maps/preview/directions?');
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('https://www.google.com/maps/preview/directions?'),
      expect.objectContaining({
        headers: expect.not.objectContaining({ Cookie: expect.any(String) }),
      }),
    );
  });

  it('caches identical Google requests by generated URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: async () => sampleResponse(),
    });
    vi.stubGlobal('fetch', fetchMock);

    const request = {
      origin,
      destination,
      time: { kind: 'departAtLocal' as const, localDateTime: '2026-06-21T19:30' },
    };
    await fetchGoogleMapsPreviewDirections(request);
    await fetchGoogleMapsPreviewDirections(request);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('deduplicates concurrent identical Google requests', async () => {
    let resolveText: (value: string) => void = () => {};
    const textPromise = new Promise<string>((resolve) => { resolveText = resolve; });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: () => textPromise,
    });
    vi.stubGlobal('fetch', fetchMock);

    const request = {
      origin,
      destination,
      time: { kind: 'departAtLocal' as const, localDateTime: '2026-06-21T19:30' },
    };
    const first = fetchGoogleMapsPreviewDirections(request);
    const second = fetchGoogleMapsPreviewDirections(request);
    resolveText(sampleResponse());

    const results = await Promise.all([first, second]);
    expect(results[0].routes[0].title).toBe('ON-401 E');
    expect(results[1].routes[0].title).toBe('ON-401 E');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
