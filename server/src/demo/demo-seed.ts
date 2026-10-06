import { readEnv } from '../app-config';
import { DemoRepository, type NewDemoPlaceRow } from '../db/repositories/DemoRepository';
import { DEMO_PASS } from '../nest/common/demo';
// Static like in demo-reset.job.ts: the module top is inert, everything that
// touches the database happens inside the functions.
import { saveBaseline, hasBaseline, requireEntityManager } from './demo-reset';

import bcrypt from 'bcryptjs';

// D6 (task-2-review.md's controller ruling / non-HTTP caller table): this runs
// from `runSchemaBootstrap` before `app.init()`, outside any request context, but
// `runSchemaBootstrap` already wraps the whole call in `withRequestContext`
// (`db/orm.ts:59`) — `requireEntityManager()` below resolves that same fork via
// `RequestContext.getEntityManager()`, the static accessor the wrap populates.
async function seedDemoData(): Promise<{ adminId: number; demoId: number }> {
  const demo = new DemoRepository(requireEntityManager());
  const ADMIN_USER = readEnv().demo.adminUser;
  const ADMIN_EMAIL = readEnv().demo.adminEmailRaw || 'admin@trek.app';
  const ADMIN_PASS = readEnv().demo.adminPass;
  const DEMO_EMAIL = 'demo@trek.app';

  // Create admin user if not exists
  const existingAdmin = await demo.findUserByEmail(ADMIN_EMAIL);
  let adminId: number;
  if (!existingAdmin) {
    if (!readEnv().demo.adminPassSet) {
      // The default is published in the docs and in this file, so an operator who
      // never set DEMO_ADMIN_PASS is handing out an admin account. Say so loudly;
      // changing the default would lock out every existing demo instance.
      console.warn(
        `[Demo] SECURITY: DEMO_ADMIN_PASS is not set. The admin account ${ADMIN_EMAIL} is being created ` +
          'with the public default password. Set DEMO_ADMIN_PASS before exposing this instance.',
      );
    }
    const hash = bcrypt.hashSync(ADMIN_PASS, 10);
    adminId = await demo.createUser({ username: ADMIN_USER, email: ADMIN_EMAIL, password_hash: hash, role: 'admin' });
    console.log('[Demo] Admin user created');
  } else {
    adminId = existingAdmin.id;
  }

  // Create demo user if not exists
  const existingDemo = await demo.findUserByEmail(DEMO_EMAIL);
  let demoId: number;
  if (!existingDemo) {
    const hash = bcrypt.hashSync(DEMO_PASS, 10);
    demoId = await demo.createUser({ username: 'demo', email: DEMO_EMAIL, password_hash: hash, role: 'user' });
    console.log('[Demo] Demo user created');
  } else {
    demoId = existingDemo.id;
  }

  // Disable registration in demo mode
  await demo.setAllowRegistrationFalse();

  // Check if admin already has example trips
  const adminTripCount = await demo.countTripsByUser(adminId);
  if (adminTripCount > 0) {
    console.log('[Demo] Example trips already exist, ensuring demo membership');
    await ensureDemoMembership(demo, adminId, demoId);
    return { adminId, demoId };
  }

  console.log('[Demo] Seeding example trips...');
  await seedExampleTrips(demo, adminId, demoId);

  // Auto-save baseline after first seed
  if (!hasBaseline()) {
    await saveBaseline();
  }

  return { adminId, demoId };
}

async function ensureDemoMembership(demo: DemoRepository, adminId: number, demoId: number): Promise<void> {
  const tripIds = await demo.listTripIdsByUser(adminId);
  for (const tripId of tripIds) {
    await demo.addTripMember(tripId, demoId, adminId);
  }
}

async function seedExampleTrips(demo: DemoRepository, adminId: number, demoId: number): Promise<void> {
  // Category IDs: 1=Hotel, 2=Restaurant, 3=Attraction, 5=Transport, 7=Bar/Cafe, 8=Beach, 9=Nature, 6=Entertainment

  // --- Trip 1: Tokyo & Kyoto ---
  const t1 = await demo.insertTrip(
    adminId,
    'Tokyo & Kyoto',
    'Two weeks in Japan — from the neon-lit streets of Tokyo to the serene temples of Kyoto.',
    '2026-04-15',
    '2026-04-21',
    'JPY',
  );

  const t1days: number[] = [];
  for (let i = 0; i < 7; i++) {
    t1days.push(await demo.insertDay(t1, i + 1, `2026-04-${15 + i}`));
  }

  const t1places: NewDemoPlaceRow[] = [
    [
      t1,
      'Hotel Shinjuku Granbell',
      35.6938,
      139.7035,
      '2-14-5 Kabukicho, Shinjuku City, Tokyo 160-0021, Japan',
      1,
      '15:00',
      60,
      'Check-in from 3 PM. Steps from Shinjuku Station.',
      null,
      'ChIJdaGEJBeMGGARYgt8sLBv6lM',
      'https://www.grfranbellhotel.jp/shinjuku/',
      '+81 3-5155-2666',
    ],
    [
      t1,
      'Senso-ji Temple',
      35.7148,
      139.7967,
      '2 Chome-3-1 Asakusa, Taito City, Tokyo 111-0032, Japan',
      3,
      '09:00',
      90,
      'Oldest temple in Tokyo. Fewer tourists in the early morning.',
      null,
      'ChIJ8T1GpMGOGGARDYGSgpoOdfg',
      'https://www.senso-ji.jp/',
      '+81 3-3842-0181',
    ],
    [
      t1,
      'Shibuya Crossing',
      35.6595,
      139.7004,
      '2 Chome-2-1 Dogenzaka, Shibuya City, Tokyo 150-0043, Japan',
      3,
      '18:00',
      45,
      "World's busiest pedestrian crossing. Most impressive at night.",
      null,
      'ChIJLyzOhmyLGGARMKWbl5z6wGg',
      null,
      null,
    ],
    [
      t1,
      'Tsukiji Outer Market',
      35.6654,
      139.7707,
      '4 Chome-16-2 Tsukiji, Chuo City, Tokyo 104-0045, Japan',
      2,
      '08:00',
      120,
      'Fresh sushi for breakfast! Explore the street food stalls.',
      null,
      'ChIJq2i1dZCLGGAR1TfoBRo25VU',
      'https://www.tsukiji.or.jp/',
      null,
    ],
    [
      t1,
      'Meiji Jingu Shrine',
      35.6764,
      139.6993,
      '1-1 Yoyogikamizonocho, Shibuya City, Tokyo 151-8557, Japan',
      3,
      '10:00',
      75,
      'Peaceful oasis in the middle of the city. Walk through the forest to the shrine.',
      null,
      'ChIJ5SuJSByMGGARMg9qOlTFgkc',
      'https://www.meijijingu.or.jp/',
      '+81 3-3379-5511',
    ],
    [
      t1,
      'Akihabara Electric Town',
      35.7023,
      139.7745,
      'Sotokanda, Chiyoda City, Tokyo, Japan',
      3,
      '14:00',
      180,
      'Electric Town — anime, manga, electronics. Retro gaming shops!',
      null,
      'ChIJGz1usEyMGGAR1mYByqOOJao',
      null,
      null,
    ],
    [
      t1,
      'Shinkansen to Kyoto',
      35.6812,
      139.7671,
      '1 Chome Marunouchi, Chiyoda City, Tokyo 100-0005, Japan',
      5,
      '08:30',
      140,
      'Nozomi Shinkansen, approx. 2h15. Window seat for Mt. Fuji views!',
      null,
      'ChIJC3Cf2PuLGGAROO00ukl8JwA',
      null,
      null,
    ],
    [
      t1,
      'Hotel Granvia Kyoto',
      34.9856,
      135.758,
      'Karasuma-dori Shiokoji-sagaru, Shimogyo-ku, Kyoto 600-8216, Japan',
      1,
      '14:00',
      60,
      'Right at Kyoto Station. Perfect base for day trips.',
      null,
      'ChIJUf6MDFcIAWARLihjKC9FWDY',
      'https://www.granvia-kyoto.co.jp/',
      '+81 75-344-8888',
    ],
    [
      t1,
      'Fushimi Inari Taisha',
      34.9671,
      135.7727,
      '68 Fukakusa Yabunouchicho, Fushimi Ward, Kyoto 612-0882, Japan',
      3,
      '07:00',
      150,
      '10,000 vermillion torii gates. Start early for empty paths!',
      null,
      'ChIJIW0JRbMIAWARPYEzP5LVHGE',
      'http://inari.jp/',
      '+81 75-641-7331',
    ],
    [
      t1,
      'Kinkaku-ji (Golden Pavilion)',
      35.0394,
      135.7292,
      '1 Kinkakujicho, Kita Ward, Kyoto 603-8361, Japan',
      3,
      '10:00',
      60,
      'The golden temple reflected in the mirror pond. Iconic photo spot.',
      null,
      'ChIJvUbrwCCoAWAR5-uyAXPzBHg',
      null,
      '+81 75-461-0013',
    ],
    [
      t1,
      'Arashiyama Bamboo Grove',
      35.0095,
      135.6673,
      'Sagatenryuji Susukinobabacho, Ukyo Ward, Kyoto 616-8385, Japan',
      9,
      '09:00',
      90,
      'Magical bamboo forest. Best visited in the morning before the crowds.',
      null,
      'ChIJFS4EvA6pAWARQsAPVijvW7I',
      null,
      null,
    ],
    [
      t1,
      'Nishiki Market',
      35.005,
      135.7647,
      'Nishiki-koji Dori, Nakagyo Ward, Kyoto 604-8054, Japan',
      2,
      '12:00',
      90,
      "Kyoto's kitchen street. Try the matcha ice cream and fresh mochi!",
      null,
      'ChIJ09zzUigJAWARXzIdh1NE3hQ',
      'http://www.kyoto-nishiki.or.jp/',
      null,
    ],
    [
      t1,
      'Gion District',
      35.0037,
      135.7755,
      'Gionmachi Minamigawa, Higashiyama Ward, Kyoto 605-0074, Japan',
      3,
      '17:00',
      120,
      'Historic geisha district. Best chance of spotting a maiko in the evening.',
      null,
      'ChIJ7WWWjfYJAWARGqEHAfXIzgQ',
      null,
      null,
    ],
  ];

  const t1pIds: number[] = [];
  for (const p of t1places) t1pIds.push(await demo.insertPlace(p));

  // Day 1: Hotel Check-in, Shibuya
  await demo.insertDayAssignment(t1days[0], t1pIds[0], 0);
  await demo.insertDayAssignment(t1days[0], t1pIds[2], 1);
  await demo.insertDayNote(t1days[0], t1, 'Pick up Pocket WiFi at airport', '13:00', 'Info', 0.5);
  // Day 2: Tsukiji, Senso-ji, Akihabara
  await demo.insertDayAssignment(t1days[1], t1pIds[3], 0);
  await demo.insertDayAssignment(t1days[1], t1pIds[1], 1);
  await demo.insertDayAssignment(t1days[1], t1pIds[5], 2);
  // Day 3: Meiji Shrine, free afternoon
  await demo.insertDayAssignment(t1days[2], t1pIds[4], 0);
  await demo.insertDayNote(t1days[2], t1, 'Explore Harajuku after the shrine', '12:00', 'MapPin', 1);
  // Day 4: Shinkansen to Kyoto, Hotel
  await demo.insertDayAssignment(t1days[3], t1pIds[6], 0);
  await demo.insertDayAssignment(t1days[3], t1pIds[7], 1);
  await demo.insertDayNote(t1days[3], t1, 'Sit on right side for Mt. Fuji views!', '08:30', 'Train', 0.5);
  // Day 5: Fushimi Inari, Nishiki Market
  await demo.insertDayAssignment(t1days[4], t1pIds[8], 0);
  await demo.insertDayAssignment(t1days[4], t1pIds[11], 1);
  // Day 6: Kinkaku-ji, Arashiyama
  await demo.insertDayAssignment(t1days[5], t1pIds[9], 0);
  await demo.insertDayAssignment(t1days[5], t1pIds[10], 1);
  // Day 7: Gion
  await demo.insertDayAssignment(t1days[6], t1pIds[12], 0);
  await demo.insertDayNote(t1days[6], t1, 'Last evening — farewell dinner at Pontocho Alley', '19:00', 'Star', 1);

  // Packing
  const t1packing: [string, number, string, number][] = [
    ['Passport', 1, 'Documents', 0],
    ['Japan Rail Pass', 1, 'Documents', 1],
    ['Power adapter Type A/B', 0, 'Electronics', 2],
    ['Camera + charger', 0, 'Electronics', 3],
    ['Comfortable walking shoes', 0, 'Clothing', 4],
    ['Rain jacket', 0, 'Clothing', 5],
    ['Sunscreen', 0, 'Toiletries', 6],
    ['Travel first aid kit', 0, 'Toiletries', 7],
    ['Pocket WiFi confirmation', 1, 'Electronics', 8],
    ['Yen cash', 0, 'Documents', 9],
  ];
  for (const [name, checked, category, sortOrder] of t1packing)
    await demo.insertPackingItem(t1, name, checked, category, sortOrder);

  // Budget
  await demo.insertBudgetItem(t1, 'Accommodation', 'Hotel Shinjuku (3 nights)', 67500, 2, 'Double room');
  await demo.insertBudgetItem(t1, 'Accommodation', 'Hotel Granvia Kyoto (4 nights)', 102000, 2, 'Superior room');
  await demo.insertBudgetItem(t1, 'Transport', 'Flights FRA-NRT return', 180000, 2, 'Lufthansa direct');
  await demo.insertBudgetItem(t1, 'Transport', 'Japan Rail Pass (7 days)', 57000, 2, 'Ordinary');
  await demo.insertBudgetItem(t1, 'Food', 'Daily food budget', 52500, 2, 'Approx. 7,500 JPY/day');
  await demo.insertBudgetItem(t1, 'Activities', 'Temple entries & experiences', 18000, 2, null);

  // Reservations. reservation_time carries the full date, the way the booking
  // form writes it: a bare clock time is a different shape, and readers that
  // compare the column against a timestamp cannot tell the two apart (#1934).
  await demo.insertReservation(
    t1,
    t1days[0],
    'Hotel Shinjuku Check-in',
    '2026-04-15T15:00',
    'SG-2026-78432',
    'confirmed',
    'hotel',
    'Shinjuku, Tokyo',
  );
  await demo.insertReservation(
    t1,
    t1days[3],
    'Shinkansen Tokyo → Kyoto',
    '2026-04-18T08:30',
    'JR-NOZOMI-445',
    'confirmed',
    'transport',
    'Tokyo Station',
  );

  await demo.addTripMember(t1, demoId, adminId);

  // --- Trip 2: Barcelona Long Weekend ---
  const t2 = await demo.insertTrip(
    adminId,
    'Barcelona Long Weekend',
    'Gaudi, tapas, and Mediterranean vibes — a long weekend in the Catalan capital.',
    '2026-05-21',
    '2026-05-24',
    'EUR',
  );

  const t2days: number[] = [];
  for (let i = 0; i < 4; i++) {
    t2days.push(await demo.insertDay(t2, i + 1, `2026-05-${21 + i}`));
  }

  const t2places: NewDemoPlaceRow[] = [
    [
      t2,
      'W Barcelona',
      41.3686,
      2.192,
      'Placa de la Rosa dels Vents 1, 08039 Barcelona, Spain',
      1,
      '14:00',
      60,
      'Right on the beach. Rooftop bar with panoramic views!',
      null,
      'ChIJKfj5C8yjpBIRCPC3RPI0JO4',
      'https://www.marriott.com/hotels/travel/bcnwh-w-barcelona/',
      '+34 932 95 28 00',
    ],
    [
      t2,
      'Sagrada Familia',
      41.4036,
      2.1744,
      'C/ de Mallorca, 401, 08013 Barcelona, Spain',
      3,
      '10:00',
      120,
      "Gaudi's masterpiece. Book tickets online in advance — sells out fast!",
      null,
      'ChIJk_s92NyipBIRUMnDG8Kq2Js',
      'https://sagradafamilia.org/',
      '+34 932 08 04 14',
    ],
    [
      t2,
      'Park Guell',
      41.4145,
      2.1527,
      '08024 Barcelona, Spain',
      3,
      '09:00',
      90,
      'Mosaic terrace with city views. Book early for the Monumental Zone.',
      null,
      'ChIJ4eQMeOmipBIRb65JRUzGE8k',
      'https://parkguell.barcelona/',
      '+34 934 09 18 31',
    ],
    [
      t2,
      'La Boqueria Market',
      41.3816,
      2.1717,
      'La Rambla, 91, 08001 Barcelona, Spain',
      2,
      '12:00',
      75,
      'Famous market on La Rambla. Fresh juice, jamon iberico, and seafood!',
      null,
      'ChIJB_RfKcuipBIRkPKW7MzVGKg',
      'http://www.boqueria.barcelona/',
      '+34 933 18 25 84',
    ],
    [
      t2,
      'Barceloneta Beach',
      41.3784,
      2.1925,
      'Passeig Maritim de la Barceloneta, 08003 Barcelona, Spain',
      8,
      '16:00',
      120,
      'City beach to unwind after sightseeing. Great chiringuitos nearby.',
      null,
      'ChIJAQCl79-ipBIRUKF3myrMYkM',
      null,
      null,
    ],
    [
      t2,
      'Gothic Quarter',
      41.3834,
      2.1762,
      'Barri Gotic, 08002 Barcelona, Spain',
      3,
      '15:00',
      90,
      'Medieval lanes, the cathedral, and Placa Reial. Get lost in the alleys!',
      null,
      'ChIJ4_xkvv2ipBIRrK3bdd-lHgo',
      null,
      null,
    ],
    [
      t2,
      'Casa Batllo',
      41.3916,
      2.165,
      'Passeig de Gracia, 43, 08007 Barcelona, Spain',
      3,
      '11:00',
      75,
      "Gaudi's dragon house. The facade alone is worth the visit.",
      null,
      'ChIJ-2VKIcaipBIRKK63H5PYjqQ',
      'https://www.casabatllo.es/',
      '+34 932 16 03 06',
    ],
    [
      t2,
      'El Born & Tapas',
      41.3856,
      2.1825,
      'El Born, 08003 Barcelona, Spain',
      7,
      '20:00',
      120,
      'Trendy neighborhood with the best tapas bars. Try Cal Pep or El Xampanyet!',
      null,
      'ChIJNY56dxuipBIRbqjSczmLvIA',
      null,
      null,
    ],
  ];

  const t2pIds: number[] = [];
  for (const p of t2places) t2pIds.push(await demo.insertPlace(p));

  // Day 1: Arrival, Beach, El Born
  await demo.insertDayAssignment(t2days[0], t2pIds[0], 0);
  await demo.insertDayAssignment(t2days[0], t2pIds[4], 1);
  await demo.insertDayAssignment(t2days[0], t2pIds[7], 2);
  // Day 2: Sagrada Familia, Casa Batllo, La Boqueria
  await demo.insertDayAssignment(t2days[1], t2pIds[1], 0);
  await demo.insertDayAssignment(t2days[1], t2pIds[6], 1);
  await demo.insertDayAssignment(t2days[1], t2pIds[3], 2);
  await demo.insertDayNote(t2days[1], t2, 'Tickets already booked for 10:00 AM slot', '09:30', 'Ticket', 0.5);
  // Day 3: Park Guell, Gothic Quarter
  await demo.insertDayAssignment(t2days[2], t2pIds[2], 0);
  await demo.insertDayAssignment(t2days[2], t2pIds[5], 1);
  // Day 4: Beach morning, departure
  await demo.insertDayAssignment(t2days[3], t2pIds[4], 0);
  await demo.insertDayNote(t2days[3], t2, 'Flight departs at 18:30 — leave hotel by 15:00', '14:00', 'Plane', 1);

  // Packing
  const t2packingNames = [
    'Passport',
    'Sunscreen SPF50',
    'Swimwear',
    'Sunglasses',
    'Comfortable sandals',
    'Beach towel',
  ];
  for (let i = 0; i < t2packingNames.length; i++) {
    await demo.insertPackingItem(t2, t2packingNames[i], 0, i < 1 ? 'Documents' : 'Summer', i);
  }

  // Budget
  await demo.insertBudgetItem(t2, 'Accommodation', 'W Barcelona (3 nights)', 780, 2, 'Sea View Room');
  await demo.insertBudgetItem(t2, 'Transport', 'Flights BER-BCN return', 180, 2, 'Eurowings');
  await demo.insertBudgetItem(t2, 'Food', 'Restaurants & tapas', 300, 2, 'Approx. 75 EUR/day');
  await demo.insertBudgetItem(t2, 'Activities', 'Sagrada Familia + Park Guell + Casa Batllo', 95, 2, 'Online tickets');

  await demo.insertReservation(
    t2,
    t2days[1],
    'Sagrada Familia Entry',
    '2026-05-22T10:00',
    'SF-2026-11234',
    'confirmed',
    'activity',
    'Eixample, Barcelona',
  );

  await demo.addTripMember(t2, demoId, adminId);

  // --- Trip 3: New York City ---
  const t3 = await demo.insertTrip(
    adminId,
    'New York City',
    'The city that never sleeps — iconic landmarks, world-class food, and Broadway lights.',
    '2026-09-18',
    '2026-09-22',
    'USD',
  );

  const t3days: number[] = [];
  for (let i = 0; i < 5; i++) {
    t3days.push(await demo.insertDay(t3, i + 1, `2026-09-${18 + i}`));
  }

  const t3places: NewDemoPlaceRow[] = [
    [
      t3,
      'The Plaza Hotel',
      40.7645,
      -73.9744,
      '768 5th Ave, New York, NY 10019, USA',
      1,
      '15:00',
      60,
      'Iconic luxury hotel on Central Park. The lobby alone is worth a visit.',
      null,
      'ChIJYbISlAVYwokRn6ORbSPV0xk',
      'https://www.theplazany.com/',
      '+1 212-759-3000',
    ],
    [
      t3,
      'Statue of Liberty',
      40.6892,
      -74.0445,
      'Liberty Island, New York, NY 10004, USA',
      3,
      '09:00',
      180,
      'Book crown access tickets months in advance. Ferry from Battery Park.',
      null,
      'ChIJPTacEpBQwokRKwIlDXelxkA',
      'https://www.nps.gov/stli/',
      '+1 212-363-3200',
    ],
    [
      t3,
      'Central Park',
      40.7829,
      -73.9654,
      'Central Park, New York, NY 10024, USA',
      9,
      '10:00',
      120,
      'Bethesda Fountain, Bow Bridge, and Strawberry Fields. Rent bikes!',
      null,
      'ChIJ4zGFAZpYwokRGUGph3Mf37k',
      'https://www.centralparknyc.org/',
      null,
    ],
    [
      t3,
      'Times Square',
      40.758,
      -73.9855,
      'Manhattan, NY 10036, USA',
      3,
      '19:00',
      60,
      'The crossroads of the world. Best experienced at night with all the lights.',
      null,
      'ChIJmQJIxlVYwokRLgeuocVOGVU',
      'https://www.timessquarenyc.org/',
      null,
    ],
    [
      t3,
      'Empire State Building',
      40.7484,
      -73.9857,
      '350 5th Ave, New York, NY 10118, USA',
      3,
      '11:00',
      90,
      '86th floor observation deck. Go at sunset for the best views.',
      null,
      'ChIJaXQRs6lZwokRY6EFpJnhNNE',
      'https://www.esbnyc.com/',
      '+1 212-736-3100',
    ],
    [
      t3,
      'Brooklyn Bridge',
      40.7061,
      -73.9969,
      'Brooklyn Bridge, New York, NY 10038, USA',
      3,
      '16:00',
      75,
      'Walk from Manhattan to Brooklyn. DUMBO has great pizza and views.',
      null,
      'ChIJK3vOQyNawokRXEYwET2GUtY',
      null,
      null,
    ],
    [
      t3,
      'The Metropolitan Museum of Art',
      40.7794,
      -73.9632,
      '1000 5th Ave, New York, NY 10028, USA',
      3,
      '10:00',
      180,
      "One of the world's greatest art museums. Could spend days here.",
      null,
      'ChIJb8Jg766MwokR1YWG0nV7k-E',
      'https://www.metmuseum.org/',
      '+1 212-535-7710',
    ],
    [
      t3,
      "Joe's Pizza",
      40.7309,
      -73.9969,
      '7 Carmine St, New York, NY 10014, USA',
      2,
      '13:00',
      30,
      "New York's most famous pizza slice. Cash only, always a line, always worth it.",
      null,
      'ChIJrfCL1IZZwokRwO3NKN22ZBc',
      'http://www.joespizzanyc.com/',
      '+1 212-366-1182',
    ],
    [
      t3,
      'Top of the Rock',
      40.7593,
      -73.9794,
      '30 Rockefeller Plaza, New York, NY 10112, USA',
      3,
      '17:30',
      60,
      'Better views than Empire State because you can SEE the Empire State.',
      null,
      'ChIJ_y2Fb1JYwokRT_iGzhTLdBo',
      'https://www.topoftherocknyc.com/',
      '+1 212-698-2000',
    ],
    [
      t3,
      'Chelsea Market',
      40.7424,
      -74.0061,
      '75 9th Ave, New York, NY 10011, USA',
      2,
      '12:00',
      90,
      'Food hall in a converted factory. Lobster rolls, tacos, doughnuts, and more.',
      null,
      'ChIJw2FNFyZZwokRcP9th_vIbkE',
      'https://www.chelseamarket.com/',
      null,
    ],
    [
      t3,
      'Broadway Show',
      40.759,
      -73.9845,
      'Broadway, Manhattan, NY 10019, USA',
      6,
      '20:00',
      150,
      "Can't visit NYC without seeing a show. Book TKTS booth for discounts.",
      null,
      'ChIJMYQhxFtYwokR7cJBcNqfKDY',
      null,
      null,
    ],
  ];

  const t3pIds: number[] = [];
  for (const p of t3places) t3pIds.push(await demo.insertPlace(p));

  // Day 1: Arrival, Times Square, Broadway
  await demo.insertDayAssignment(t3days[0], t3pIds[0], 0);
  await demo.insertDayAssignment(t3days[0], t3pIds[3], 1);
  await demo.insertDayAssignment(t3days[0], t3pIds[10], 2);
  // Day 2: Statue of Liberty, Brooklyn Bridge, Joe's Pizza
  await demo.insertDayAssignment(t3days[1], t3pIds[1], 0);
  await demo.insertDayAssignment(t3days[1], t3pIds[5], 1);
  await demo.insertDayAssignment(t3days[1], t3pIds[7], 2);
  await demo.insertDayNote(
    t3days[1],
    t3,
    'First ferry at 8:30 AM — arrive early at Battery Park',
    '08:00',
    'Ship',
    0.5,
  );
  // Day 3: Central Park, Met Museum, Top of the Rock sunset
  await demo.insertDayAssignment(t3days[2], t3pIds[2], 0);
  await demo.insertDayAssignment(t3days[2], t3pIds[6], 1);
  await demo.insertDayAssignment(t3days[2], t3pIds[8], 2);
  // Day 4: Empire State Building, Chelsea Market, shopping
  await demo.insertDayAssignment(t3days[3], t3pIds[4], 0);
  await demo.insertDayAssignment(t3days[3], t3pIds[9], 1);
  await demo.insertDayNote(t3days[3], t3, 'SoHo and 5th Avenue shopping in the afternoon', '14:00', 'ShoppingBag', 1.5);
  // Day 5: Free morning, departure
  await demo.insertDayNote(
    t3days[4],
    t3,
    'Flight departs JFK at 17:00 — last bagel at Russ & Daughters!',
    '10:00',
    'Plane',
    0,
  );

  // Packing
  const t3packing: [string, number, string, number][] = [
    ['Passport', 1, 'Documents', 0],
    ['ESTA confirmation', 1, 'Documents', 1],
    ['Travel insurance', 0, 'Documents', 2],
    ['Comfortable sneakers', 0, 'Clothing', 3],
    ['Light jacket', 0, 'Clothing', 4],
    ['Portable charger', 0, 'Electronics', 5],
    ['Camera', 0, 'Electronics', 6],
    ['Subway card (OMNY)', 0, 'Transport', 7],
  ];
  for (const [name, checked, category, sortOrder] of t3packing)
    await demo.insertPackingItem(t3, name, checked, category, sortOrder);

  // Budget
  await demo.insertBudgetItem(t3, 'Accommodation', 'The Plaza Hotel (4 nights)', 2400, 2, 'Park View Room');
  await demo.insertBudgetItem(t3, 'Transport', 'Flights FRA-JFK return', 850, 2, 'United Airlines');
  await demo.insertBudgetItem(t3, 'Food', 'Daily food budget', 500, 2, 'Approx. 100 USD/day');
  await demo.insertBudgetItem(
    t3,
    'Activities',
    'Statue of Liberty + Empire State + Top of the Rock + Met',
    180,
    2,
    'CityPASS',
  );
  await demo.insertBudgetItem(t3, 'Entertainment', 'Broadway show tickets', 300, 2, 'Hamilton or Wicked');

  await demo.insertReservation(
    t3,
    t3days[0],
    'The Plaza Hotel Check-in',
    '2026-09-18T15:00',
    'PZ-2026-55891',
    'confirmed',
    'hotel',
    '768 5th Ave, New York',
  );
  await demo.insertReservation(
    t3,
    t3days[0],
    'Broadway Show',
    '2026-09-18T20:00',
    'BW-HAM-2026-1192',
    'pending',
    'activity',
    'Richard Rodgers Theatre',
  );
  await demo.insertReservation(
    t3,
    t3days[1],
    'Statue of Liberty Ferry',
    '2026-09-19T08:30',
    'SOL-2026-3347',
    'confirmed',
    'transport',
    'Battery Park',
  );

  await demo.addTripMember(t3, demoId, adminId);

  console.log('[Demo] 3 example trips seeded and shared with demo user');
}

export { seedDemoData };
