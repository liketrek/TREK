import type { NotificationLocale } from '../externalNotifications/types';

const lt: NotificationLocale = {
  email: {
    footer: 'Šį pranešimą gavote, nes „TREK" programoje įjungti pranešimai.',
    manage: 'Tvarkyti nuostatas Nustatymuose',
    madeWith: 'Sukurta su',
    openTrek: 'Atidaryti TREK',
  },
  events: {
    trip_invite: (p) => ({
      title: `Kvietimas į kelionę: „${p.trip}"`,
      body: `${p.actor} pakvietė ${p.invitee || 'narį'} į kelionę „${p.trip}".`,
    }),
    booking_change: (p) => ({
      title: `Nauja rezervacija: ${p.booking}`,
      body: `${p.actor} pridėjo naują ${p.type} „${p.booking}" prie kelionės „${p.trip}".`,
    }),
    trip_reminder: (p) => ({
      title: `Priminimas apie kelionę: ${p.trip}`,
      body: `Jūsų kelionė „${p.trip}" jau greitai!`,
    }),
    todo_due: (p) => ({
      title: `Užduoties terminas: ${p.todo}`,
      body: `„${p.todo}" (kelionėje „${p.trip}") terminas – ${p.due}.`,
    }),
    vacay_invite: (p) => ({
      title: 'Kvietimas sujungti atostogas',
      body: `${p.actor} pakvietė jus sujungti atostogų planus. Atidarykite TREK, kad priimtumėte arba atmestumėte.`,
    }),
    vacay_share: (p) => ({
      title: 'Pasidalyta atostogų kalendoriumi',
      body: `${p.actor} pasidalijo su jumis savo atostogų kalendoriumi. Atidarykite TREK, kad peržiūrėtumėte.`,
    }),
    collection_invite: (p) => ({
      title: 'Kvietimas į kolekciją',
      body: `${p.actor} pakvietė jus bendrai naudotis kolekcija. Atidarykite TREK, kad priimtumėte arba atmestumėte.`,
    }),
    photos_shared: (p) => ({
      title: `Pasidalyta nuotraukomis (${p.count})`,
      body: `${p.actor} pasidalijo nuotraukomis (${p.count}) kelionėje „${p.trip}".`,
    }),
    collab_message: (p) => ({
      title: `Nauja žinutė kelionėje „${p.trip}"`,
      body: `${p.actor}: ${p.preview}`,
    }),
    packing_tagged: (p) => ({
      title: `Daiktų sąrašas: ${p.category}`,
      body: `${p.actor} priskyrė jus prie „${p.category}" daiktų sąrašo kategorijos kelionėje „${p.trip}".`,
    }),
    version_available: (p) => ({
      title: 'Yra nauja TREK versija',
      body: `Jau galima atsisiųsti TREK ${p.version}. Apsilankykite administravimo skydelyje, kad atnaujintumėte.`,
    }),
    replica_failure: (p) => ({
      title: 'Saugyklos kopijos klaida',
      body:
        `Nepavyko įrašyti kopijos „${p.backend}": ${p.op}, ${p.key} — ${p.error}.` +
        (p.suppressed !== '0' ? ` Nuo paskutinio pranešimo nuslopinta dar ${p.suppressed} klaidų.` : ''),
    }),
    synology_session_cleared: () => ({
      title: 'Synology seansas išvalytas',
      body: 'Pasikeitė jūsų Synology paskyra arba URL. Buvote atjungti nuo Synology Photos.',
    }),
    plugin_notification: (p) => ({ title: p.title ?? '', body: p.body ?? '' }),
  },
  passwordReset: {
    subject: 'Slaptažodžio atkūrimas',
    greeting: 'Sveiki',
    body: 'Gavome jūsų TREK paskyros slaptažodžio atkūrimo užklausą. Spustelėkite mygtuką žemiau, kad nustatytumėte naują slaptažodį.',
    ctaIntro: 'Atkurti slaptažodį',
    expiry: 'Ši nuoroda galioja 60 minučių.',
    ignore: 'Jei šio veiksmo neinicijavote, galite ramiai ignoruoti šį laišką — jūsų slaptažodis nepasikeis.',
  },
};

export default lt;
