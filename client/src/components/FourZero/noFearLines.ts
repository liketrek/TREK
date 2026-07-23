// TREK 4.0.0 release moment — "KEINE ANGST". Temporary by design: this whole
// folder ships for one release and is removed afterwards, so the copy lives in a
// local dictionary instead of the shared i18n bundles (no parity churn across
// 20+ locale files for a feature with a lifespan of one version).

export interface NoFearCopy {
  beaconTitle: string
  beaconSub: string
  beaconCta: string
  // The show's spoken lines, in order. Index maps to the show script.
  lines: {
    afraid: string
    ofTheStranger: string
    fearTool: string
    hateTrade: string
    butYouTraveled: string
    tables: string
    face: string
    fences: string
    notAnOpinion: string
  }
  anthem: string
  creditTitle: string
  creditBody: string
  inspiredBy: string
  close: string
  skip: string
  soundOn: string
  soundOff: string
}

const en: NoFearCopy = {
  beaconTitle: 'NO FEAR',
  beaconSub: 'A sign for an open world.',
  beaconCta: 'Press play.',
  lines: {
    afraid: 'They want you to be afraid.',
    ofTheStranger: 'Afraid of the stranger. Afraid of everything you don’t know.',
    fearTool: 'Because fear closes borders — first on maps, then in minds.',
    hateTrade: 'Fear is their tool. Hatred is their trade.',
    butYouTraveled: 'But you have traveled.',
    tables: 'You have eaten at foreign tables. Slept under foreign roofs. Laughed with strangers.',
    face: 'You know: the stranger has a face. And it looks like yours.',
    fences: 'No one who has seen the world wants it locked behind fences again.',
    notAnOpinion: 'Racism is not an opinion. Fascism is not an alternative.',
  },
  anthem: 'NO FEAR',
  creditTitle: 'TREK 4.0.0 — for an open world.',
  creditBody: 'Against racism, hatred and fascism. Travel turns strangers into neighbors.',
  inspiredBy: 'Inspired by Danger Dan — “Keine Angst”',
  close: 'Carry it on',
  skip: 'Skip',
  soundOn: 'Sound on',
  soundOff: 'Sound off',
}

const de: NoFearCopy = {
  beaconTitle: 'KEINE ANGST',
  beaconSub: 'Ein Zeichen für eine offene Welt.',
  beaconCta: 'Drück Play.',
  lines: {
    afraid: 'Sie wollen, dass du Angst hast.',
    ofTheStranger: 'Angst vor dem Fremden. Angst vor allem, was du nicht kennst.',
    fearTool: 'Denn Angst schließt Grenzen — erst auf Karten, dann in Köpfen.',
    hateTrade: 'Angst ist ihr Werkzeug. Hass ist ihr Geschäft.',
    butYouTraveled: 'Aber du bist gereist.',
    tables: 'Du hast an fremden Tischen gegessen. Unter fremden Dächern geschlafen. Mit Fremden gelacht.',
    face: 'Du weißt: Das Fremde hat ein Gesicht. Und es sieht aus wie deins.',
    fences: 'Niemand, der die Welt gesehen hat, will sie wieder hinter Zäune sperren.',
    notAnOpinion: 'Rassismus ist keine Meinung. Faschismus ist keine Alternative.',
  },
  anthem: 'KEINE ANGST',
  creditTitle: 'TREK 4.0.0 — für eine offene Welt.',
  creditBody: 'Gegen Rassismus, Hass und Faschismus. Reisen macht aus Fremden Nachbarn.',
  inspiredBy: 'Inspiriert von Danger Dan — „Keine Angst“',
  close: 'Weitertragen',
  skip: 'Überspringen',
  soundOn: 'Ton an',
  soundOff: 'Ton aus',
}

const es: NoFearCopy = {
  beaconTitle: 'SIN MIEDO',
  beaconSub: 'Una señal por un mundo abierto.',
  beaconCta: 'Pulsa play.',
  lines: {
    afraid: 'Quieren que tengas miedo.',
    ofTheStranger: 'Miedo al extranjero. Miedo a todo lo que no conoces.',
    fearTool: 'Porque el miedo cierra fronteras — primero en los mapas, luego en las mentes.',
    hateTrade: 'El miedo es su herramienta. El odio, su negocio.',
    butYouTraveled: 'Pero tú has viajado.',
    tables: 'Has comido en mesas ajenas. Dormido bajo techos ajenos. Reído con desconocidos.',
    face: 'Lo sabes: lo extranjero tiene un rostro. Y se parece al tuyo.',
    fences: 'Nadie que haya visto el mundo quiere volver a encerrarlo tras vallas.',
    notAnOpinion: 'El racismo no es una opinión. El fascismo no es una alternativa.',
  },
  anthem: 'SIN MIEDO',
  creditTitle: 'TREK 4.0.0 — por un mundo abierto.',
  creditBody: 'Contra el racismo, el odio y el fascismo. Viajar convierte a extraños en vecinos.',
  inspiredBy: 'Inspirado en Danger Dan — “Keine Angst”',
  close: 'Llévalo contigo',
  skip: 'Saltar',
  soundOn: 'Sonido sí',
  soundOff: 'Sonido no',
}

const fr: NoFearCopy = {
  beaconTitle: 'SANS PEUR',
  beaconSub: 'Un signe pour un monde ouvert.',
  beaconCta: 'Appuie sur play.',
  lines: {
    afraid: 'Ils veulent que tu aies peur.',
    ofTheStranger: 'Peur de l’étranger. Peur de tout ce que tu ne connais pas.',
    fearTool: 'Car la peur ferme les frontières — d’abord sur les cartes, puis dans les têtes.',
    hateTrade: 'La peur est leur outil. La haine, leur commerce.',
    butYouTraveled: 'Mais toi, tu as voyagé.',
    tables: 'Tu as mangé à des tables étrangères. Dormi sous des toits étrangers. Ri avec des inconnus.',
    face: 'Tu le sais : l’étranger a un visage. Et il ressemble au tien.',
    fences: 'Personne qui a vu le monde ne veut le remettre derrière des clôtures.',
    notAnOpinion: 'Le racisme n’est pas une opinion. Le fascisme n’est pas une alternative.',
  },
  anthem: 'SANS PEUR',
  creditTitle: 'TREK 4.0.0 — pour un monde ouvert.',
  creditBody: 'Contre le racisme, la haine et le fascisme. Voyager fait des étrangers des voisins.',
  inspiredBy: 'Inspiré par Danger Dan — « Keine Angst »',
  close: 'Fais-le vivre',
  skip: 'Passer',
  soundOn: 'Son activé',
  soundOff: 'Son coupé',
}

const it: NoFearCopy = {
  beaconTitle: 'SENZA PAURA',
  beaconSub: 'Un segno per un mondo aperto.',
  beaconCta: 'Premi play.',
  lines: {
    afraid: 'Vogliono che tu abbia paura.',
    ofTheStranger: 'Paura dello straniero. Paura di tutto ciò che non conosci.',
    fearTool: 'Perché la paura chiude i confini — prima sulle mappe, poi nelle teste.',
    hateTrade: 'La paura è il loro strumento. L’odio, il loro commercio.',
    butYouTraveled: 'Ma tu hai viaggiato.',
    tables: 'Hai mangiato a tavole straniere. Dormito sotto tetti stranieri. Riso con sconosciuti.',
    face: 'Lo sai: lo straniero ha un volto. E assomiglia al tuo.',
    fences: 'Nessuno che ha visto il mondo vuole richiuderlo dietro recinzioni.',
    notAnOpinion: 'Il razzismo non è un’opinione. Il fascismo non è un’alternativa.',
  },
  anthem: 'SENZA PAURA',
  creditTitle: 'TREK 4.0.0 — per un mondo aperto.',
  creditBody: 'Contro il razzismo, l’odio e il fascismo. Viaggiare trasforma gli estranei in vicini.',
  inspiredBy: 'Ispirato a Danger Dan — “Keine Angst”',
  close: 'Portalo avanti',
  skip: 'Salta',
  soundOn: 'Audio sì',
  soundOff: 'Audio no',
}

const nl: NoFearCopy = {
  beaconTitle: 'GEEN ANGST',
  beaconSub: 'Een teken voor een open wereld.',
  beaconCta: 'Druk op play.',
  lines: {
    afraid: 'Ze willen dat je bang bent.',
    ofTheStranger: 'Bang voor de vreemdeling. Bang voor alles wat je niet kent.',
    fearTool: 'Want angst sluit grenzen — eerst op kaarten, dan in hoofden.',
    hateTrade: 'Angst is hun gereedschap. Haat is hun handel.',
    butYouTraveled: 'Maar jij hebt gereisd.',
    tables: 'Je hebt aan vreemde tafels gegeten. Onder vreemde daken geslapen. Met vreemden gelachen.',
    face: 'Je weet het: het vreemde heeft een gezicht. En het lijkt op het jouwe.',
    fences: 'Niemand die de wereld heeft gezien, wil haar weer achter hekken zetten.',
    notAnOpinion: 'Racisme is geen mening. Fascisme is geen alternatief.',
  },
  anthem: 'GEEN ANGST',
  creditTitle: 'TREK 4.0.0 — voor een open wereld.',
  creditBody: 'Tegen racisme, haat en fascisme. Reizen maakt van vreemden buren.',
  inspiredBy: 'Geïnspireerd door Danger Dan — “Keine Angst”',
  close: 'Draag het verder',
  skip: 'Overslaan',
  soundOn: 'Geluid aan',
  soundOff: 'Geluid uit',
}

const pl: NoFearCopy = {
  beaconTitle: 'BEZ STRACHU',
  beaconSub: 'Znak dla otwartego świata.',
  beaconCta: 'Naciśnij play.',
  lines: {
    afraid: 'Chcą, żebyś się bał.',
    ofTheStranger: 'Bał obcego. Bał wszystkiego, czego nie znasz.',
    fearTool: 'Bo strach zamyka granice — najpierw na mapach, potem w głowach.',
    hateTrade: 'Strach to ich narzędzie. Nienawiść to ich interes.',
    butYouTraveled: 'Ale ty podróżowałeś.',
    tables: 'Jadłeś przy obcych stołach. Spałeś pod obcymi dachami. Śmiałeś się z nieznajomymi.',
    face: 'Wiesz: obcy ma twarz. I wygląda jak twoja.',
    fences: 'Nikt, kto widział świat, nie chce go znów zamykać za płotami.',
    notAnOpinion: 'Rasizm to nie opinia. Faszyzm to nie alternatywa.',
  },
  anthem: 'BEZ STRACHU',
  creditTitle: 'TREK 4.0.0 — dla otwartego świata.',
  creditBody: 'Przeciw rasizmowi, nienawiści i faszyzmowi. Podróże zmieniają obcych w sąsiadów.',
  inspiredBy: 'Inspirowane utworem Danger Dan — „Keine Angst”',
  close: 'Nieś to dalej',
  skip: 'Pomiń',
  soundOn: 'Dźwięk wł.',
  soundOff: 'Dźwięk wył.',
}

const ru: NoFearCopy = {
  beaconTitle: 'БЕЗ СТРАХА',
  beaconSub: 'Знак открытого мира.',
  beaconCta: 'Нажми play.',
  lines: {
    afraid: 'Они хотят, чтобы ты боялся.',
    ofTheStranger: 'Боялся чужого. Боялся всего, чего не знаешь.',
    fearTool: 'Потому что страх закрывает границы — сначала на картах, потом в головах.',
    hateTrade: 'Страх — их инструмент. Ненависть — их ремесло.',
    butYouTraveled: 'Но ты путешествовал.',
    tables: 'Ты ел за чужими столами. Спал под чужими крышами. Смеялся с незнакомцами.',
    face: 'Ты знаешь: у чужого есть лицо. И оно похоже на твоё.',
    fences: 'Никто, кто видел мир, не хочет снова запирать его за заборами.',
    notAnOpinion: 'Расизм — не мнение. Фашизм — не альтернатива.',
  },
  anthem: 'БЕЗ СТРАХА',
  creditTitle: 'TREK 4.0.0 — за открытый мир.',
  creditBody: 'Против расизма, ненависти и фашизма. Путешествия превращают чужих в соседей.',
  inspiredBy: 'Вдохновлено Danger Dan — «Keine Angst»',
  close: 'Передай дальше',
  skip: 'Пропустить',
  soundOn: 'Звук вкл.',
  soundOff: 'Звук выкл.',
}

const uk: NoFearCopy = {
  beaconTitle: 'БЕЗ СТРАХУ',
  beaconSub: 'Знак відкритого світу.',
  beaconCta: 'Натисни play.',
  lines: {
    afraid: 'Вони хочуть, щоб ти боявся.',
    ofTheStranger: 'Боявся чужого. Боявся всього, чого не знаєш.',
    fearTool: 'Бо страх закриває кордони — спершу на мапах, потім у головах.',
    hateTrade: 'Страх — їхній інструмент. Ненависть — їхнє ремесло.',
    butYouTraveled: 'Але ти подорожував.',
    tables: 'Ти їв за чужими столами. Спав під чужими дахами. Сміявся з незнайомцями.',
    face: 'Ти знаєш: чуже має обличчя. І воно схоже на твоє.',
    fences: 'Ніхто, хто бачив світ, не хоче знову замикати його за парканами.',
    notAnOpinion: 'Расизм — не думка. Фашизм — не альтернатива.',
  },
  anthem: 'БЕЗ СТРАХУ',
  creditTitle: 'TREK 4.0.0 — за відкритий світ.',
  creditBody: 'Проти расизму, ненависті й фашизму. Подорожі перетворюють чужих на сусідів.',
  inspiredBy: 'Натхнено Danger Dan — «Keine Angst»',
  close: 'Передай далі',
  skip: 'Пропустити',
  soundOn: 'Звук увімк.',
  soundOff: 'Звук вимк.',
}

const cs: NoFearCopy = {
  beaconTitle: 'BEZE STRACHU',
  beaconSub: 'Znamení pro otevřený svět.',
  beaconCta: 'Stiskni play.',
  lines: {
    afraid: 'Chtějí, aby ses bál.',
    ofTheStranger: 'Bál cizího. Bál všeho, co neznáš.',
    fearTool: 'Protože strach zavírá hranice — nejdřív na mapách, pak v hlavách.',
    hateTrade: 'Strach je jejich nástroj. Nenávist jejich obchod.',
    butYouTraveled: 'Ale ty jsi cestoval.',
    tables: 'Jedl jsi u cizích stolů. Spal pod cizími střechami. Smál se s cizinci.',
    face: 'Víš: cizí má tvář. A vypadá jako ta tvoje.',
    fences: 'Nikdo, kdo viděl svět, ho nechce znovu zavírat za ploty.',
    notAnOpinion: 'Rasismus není názor. Fašismus není alternativa.',
  },
  anthem: 'BEZE STRACHU',
  creditTitle: 'TREK 4.0.0 — pro otevřený svět.',
  creditBody: 'Proti rasismu, nenávisti a fašismu. Cestování dělá z cizinců sousedy.',
  inspiredBy: 'Inspirováno Danger Dan — „Keine Angst“',
  close: 'Nes to dál',
  skip: 'Přeskočit',
  soundOn: 'Zvuk zap.',
  soundOff: 'Zvuk vyp.',
}

const sv: NoFearCopy = {
  beaconTitle: 'INGEN RÄDSLA',
  beaconSub: 'Ett tecken för en öppen värld.',
  beaconCta: 'Tryck på play.',
  lines: {
    afraid: 'De vill att du ska vara rädd.',
    ofTheStranger: 'Rädd för främlingen. Rädd för allt du inte känner.',
    fearTool: 'För rädsla stänger gränser — först på kartor, sedan i huvuden.',
    hateTrade: 'Rädsla är deras verktyg. Hat är deras handel.',
    butYouTraveled: 'Men du har rest.',
    tables: 'Du har ätit vid främmande bord. Sovit under främmande tak. Skrattat med främlingar.',
    face: 'Du vet: det främmande har ett ansikte. Och det liknar ditt.',
    fences: 'Ingen som har sett världen vill låsa in den bakom stängsel igen.',
    notAnOpinion: 'Rasism är ingen åsikt. Fascism är inget alternativ.',
  },
  anthem: 'INGEN RÄDSLA',
  creditTitle: 'TREK 4.0.0 — för en öppen värld.',
  creditBody: 'Mot rasism, hat och fascism. Att resa gör främlingar till grannar.',
  inspiredBy: 'Inspirerat av Danger Dan — ”Keine Angst”',
  close: 'För det vidare',
  skip: 'Hoppa över',
  soundOn: 'Ljud på',
  soundOff: 'Ljud av',
}

const tr: NoFearCopy = {
  beaconTitle: 'KORKMA',
  beaconSub: 'Açık bir dünya için bir işaret.',
  beaconCta: 'Play’e bas.',
  lines: {
    afraid: 'Korkmanı istiyorlar.',
    ofTheStranger: 'Yabancıdan korkmanı. Bilmediğin her şeyden korkmanı.',
    fearTool: 'Çünkü korku sınırları kapatır — önce haritalarda, sonra zihinlerde.',
    hateTrade: 'Korku onların aracı. Nefret onların ticareti.',
    butYouTraveled: 'Ama sen seyahat ettin.',
    tables: 'Yabancı sofralarda yemek yedin. Yabancı çatılar altında uyudun. Yabancılarla güldün.',
    face: 'Biliyorsun: yabancının bir yüzü var. Ve seninkine benziyor.',
    fences: 'Dünyayı görmüş hiç kimse onu yeniden çitlerin arkasına kapatmak istemez.',
    notAnOpinion: 'Irkçılık bir görüş değildir. Faşizm bir alternatif değildir.',
  },
  anthem: 'KORKMA',
  creditTitle: 'TREK 4.0.0 — açık bir dünya için.',
  creditBody: 'Irkçılığa, nefrete ve faşizme karşı. Seyahat, yabancıları komşulara dönüştürür.',
  inspiredBy: 'Danger Dan’den ilhamla — “Keine Angst”',
  close: 'Taşımaya devam et',
  skip: 'Atla',
  soundOn: 'Ses açık',
  soundOff: 'Ses kapalı',
}

const gr: NoFearCopy = {
  beaconTitle: 'ΧΩΡΙΣ ΦΟΒΟ',
  beaconSub: 'Ένα σημάδι για έναν ανοιχτό κόσμο.',
  beaconCta: 'Πάτα play.',
  lines: {
    afraid: 'Θέλουν να φοβάσαι.',
    ofTheStranger: 'Να φοβάσαι τον ξένο. Να φοβάσαι ό,τι δεν γνωρίζεις.',
    fearTool: 'Γιατί ο φόβος κλείνει σύνορα — πρώτα στους χάρτες, μετά στα μυαλά.',
    hateTrade: 'Ο φόβος είναι το εργαλείο τους. Το μίσος, το εμπόριό τους.',
    butYouTraveled: 'Όμως εσύ ταξίδεψες.',
    tables: 'Έφαγες σε ξένα τραπέζια. Κοιμήθηκες κάτω από ξένες στέγες. Γέλασες με αγνώστους.',
    face: 'Το ξέρεις: το ξένο έχει πρόσωπο. Και μοιάζει με το δικό σου.',
    fences: 'Κανείς που είδε τον κόσμο δεν θέλει να τον ξανακλείσει πίσω από φράχτες.',
    notAnOpinion: 'Ο ρατσισμός δεν είναι άποψη. Ο φασισμός δεν είναι εναλλακτική.',
  },
  anthem: 'ΧΩΡΙΣ ΦΟΒΟ',
  creditTitle: 'TREK 4.0.0 — για έναν ανοιχτό κόσμο.',
  creditBody: 'Ενάντια στον ρατσισμό, το μίσος και τον φασισμό. Το ταξίδι κάνει τους ξένους γείτονες.',
  inspiredBy: 'Εμπνευσμένο από τον Danger Dan — «Keine Angst»',
  close: 'Δώσ’ το παρακάτω',
  skip: 'Παράλειψη',
  soundOn: 'Ήχος ναι',
  soundOff: 'Ήχος όχι',
}

const hu: NoFearCopy = {
  beaconTitle: 'NE FÉLJ',
  beaconSub: 'Jel egy nyitott világért.',
  beaconCta: 'Nyomd meg a play-t.',
  lines: {
    afraid: 'Azt akarják, hogy félj.',
    ofTheStranger: 'Félj az idegentől. Félj mindentől, amit nem ismersz.',
    fearTool: 'Mert a félelem határokat zár le — előbb a térképeken, aztán a fejekben.',
    hateTrade: 'A félelem az eszközük. A gyűlölet az üzletük.',
    butYouTraveled: 'De te utaztál.',
    tables: 'Idegen asztaloknál ettél. Idegen tetők alatt aludtál. Idegenekkel nevettél.',
    face: 'Tudod: az idegennek arca van. És a tiédre hasonlít.',
    fences: 'Senki, aki látta a világot, nem akarja újra kerítések mögé zárni.',
    notAnOpinion: 'A rasszizmus nem vélemény. A fasizmus nem alternatíva.',
  },
  anthem: 'NE FÉLJ',
  creditTitle: 'TREK 4.0.0 — egy nyitott világért.',
  creditBody: 'A rasszizmus, a gyűlölet és a fasizmus ellen. Az utazás szomszédokká teszi az idegeneket.',
  inspiredBy: 'Danger Dan ihlette — „Keine Angst”',
  close: 'Add tovább',
  skip: 'Kihagyás',
  soundOn: 'Hang be',
  soundOff: 'Hang ki',
}

const br: NoFearCopy = {
  beaconTitle: 'SEM MEDO',
  beaconSub: 'Um sinal por um mundo aberto.',
  beaconCta: 'Aperte play.',
  lines: {
    afraid: 'Eles querem que você tenha medo.',
    ofTheStranger: 'Medo do estrangeiro. Medo de tudo o que você não conhece.',
    fearTool: 'Porque o medo fecha fronteiras — primeiro nos mapas, depois nas mentes.',
    hateTrade: 'O medo é a ferramenta deles. O ódio, o seu negócio.',
    butYouTraveled: 'Mas você viajou.',
    tables: 'Você comeu em mesas estrangeiras. Dormiu sob tetos estrangeiros. Riu com desconhecidos.',
    face: 'Você sabe: o estrangeiro tem um rosto. E ele se parece com o seu.',
    fences: 'Ninguém que viu o mundo quer trancá-lo atrás de cercas de novo.',
    notAnOpinion: 'Racismo não é opinião. Fascismo não é alternativa.',
  },
  anthem: 'SEM MEDO',
  creditTitle: 'TREK 4.0.0 — por um mundo aberto.',
  creditBody: 'Contra o racismo, o ódio e o fascismo. Viajar transforma estranhos em vizinhos.',
  inspiredBy: 'Inspirado em Danger Dan — “Keine Angst”',
  close: 'Leve adiante',
  skip: 'Pular',
  soundOn: 'Som ligado',
  soundOff: 'Som desligado',
}

const ca: NoFearCopy = {
  beaconTitle: 'SENSE POR',
  beaconSub: 'Un senyal per un món obert.',
  beaconCta: 'Prem play.',
  lines: {
    afraid: 'Volen que tinguis por.',
    ofTheStranger: 'Por de l’estranger. Por de tot allò que no coneixes.',
    fearTool: 'Perquè la por tanca fronteres — primer als mapes, després a les ments.',
    hateTrade: 'La por és la seva eina. L’odi, el seu negoci.',
    butYouTraveled: 'Però tu has viatjat.',
    tables: 'Has menjat a taules estrangeres. Dormit sota sostres estrangers. Rigut amb desconeguts.',
    face: 'Ho saps: l’estranger té un rostre. I s’assembla al teu.',
    fences: 'Ningú que hagi vist el món vol tornar-lo a tancar rere tanques.',
    notAnOpinion: 'El racisme no és una opinió. El feixisme no és una alternativa.',
  },
  anthem: 'SENSE POR',
  creditTitle: 'TREK 4.0.0 — per un món obert.',
  creditBody: 'Contra el racisme, l’odi i el feixisme. Viatjar converteix els estranys en veïns.',
  inspiredBy: 'Inspirat en Danger Dan — «Keine Angst»',
  close: 'Porta-ho endavant',
  skip: 'Omet',
  soundOn: 'So activat',
  soundOff: 'So desactivat',
}

const id: NoFearCopy = {
  beaconTitle: 'JANGAN TAKUT',
  beaconSub: 'Tanda untuk dunia yang terbuka.',
  beaconCta: 'Tekan play.',
  lines: {
    afraid: 'Mereka ingin kamu takut.',
    ofTheStranger: 'Takut pada orang asing. Takut pada semua yang tidak kamu kenal.',
    fearTool: 'Karena rasa takut menutup perbatasan — mula-mula di peta, lalu di kepala.',
    hateTrade: 'Rasa takut adalah alat mereka. Kebencian adalah dagangan mereka.',
    butYouTraveled: 'Tapi kamu sudah bepergian.',
    tables: 'Kamu pernah makan di meja orang asing. Tidur di bawah atap asing. Tertawa bersama orang tak dikenal.',
    face: 'Kamu tahu: orang asing punya wajah. Dan wajah itu mirip wajahmu.',
    fences: 'Tak seorang pun yang pernah melihat dunia ingin menguncinya lagi di balik pagar.',
    notAnOpinion: 'Rasisme bukan pendapat. Fasisme bukan alternatif.',
  },
  anthem: 'JANGAN TAKUT',
  creditTitle: 'TREK 4.0.0 — untuk dunia yang terbuka.',
  creditBody: 'Melawan rasisme, kebencian, dan fasisme. Bepergian mengubah orang asing menjadi tetangga.',
  inspiredBy: 'Terinspirasi oleh Danger Dan — “Keine Angst”',
  close: 'Teruskan',
  skip: 'Lewati',
  soundOn: 'Suara aktif',
  soundOff: 'Suara mati',
}

const vi: NoFearCopy = {
  beaconTitle: 'ĐỪNG SỢ',
  beaconSub: 'Một dấu hiệu cho thế giới rộng mở.',
  beaconCta: 'Nhấn play.',
  lines: {
    afraid: 'Họ muốn bạn sợ hãi.',
    ofTheStranger: 'Sợ người lạ. Sợ tất cả những gì bạn không biết.',
    fearTool: 'Vì nỗi sợ đóng lại biên giới — trước tiên trên bản đồ, rồi trong tâm trí.',
    hateTrade: 'Nỗi sợ là công cụ của họ. Hận thù là món hàng của họ.',
    butYouTraveled: 'Nhưng bạn đã đi xa.',
    tables: 'Bạn đã ăn ở những bàn ăn xa lạ. Ngủ dưới những mái nhà xa lạ. Cười với những người chưa quen.',
    face: 'Bạn biết: người lạ có một gương mặt. Và nó giống gương mặt bạn.',
    fences: 'Không ai từng thấy thế giới lại muốn nhốt nó sau hàng rào lần nữa.',
    notAnOpinion: 'Phân biệt chủng tộc không phải là quan điểm. Chủ nghĩa phát xít không phải là lựa chọn thay thế.',
  },
  anthem: 'ĐỪNG SỢ',
  creditTitle: 'TREK 4.0.0 — vì một thế giới rộng mở.',
  creditBody: 'Chống phân biệt chủng tộc, hận thù và chủ nghĩa phát xít. Du lịch biến người lạ thành láng giềng.',
  inspiredBy: 'Lấy cảm hứng từ Danger Dan — “Keine Angst”',
  close: 'Lan tỏa tiếp',
  skip: 'Bỏ qua',
  soundOn: 'Bật âm thanh',
  soundOff: 'Tắt âm thanh',
}

const ja: NoFearCopy = {
  beaconTitle: '恐れないで',
  beaconSub: '開かれた世界へのしるし。',
  beaconCta: '再生を押して。',
  lines: {
    afraid: '彼らはあなたに怯えてほしいのです。',
    ofTheStranger: '見知らぬ人を恐れ、知らないものすべてを恐れるように。',
    fearTool: '恐怖は国境を閉ざします — まず地図の上で、やがて心の中で。',
    hateTrade: '恐怖は彼らの道具。憎しみは彼らの商売。',
    butYouTraveled: 'でも、あなたは旅をしてきた。',
    tables: '見知らぬ食卓で食事をし、見知らぬ屋根の下で眠り、見知らぬ人と笑い合った。',
    face: 'あなたは知っている。「よそ者」には顔があり、それはあなたの顔に似ていることを。',
    fences: '世界を見た人は誰も、それを再び柵の中に閉じ込めたいとは思わない。',
    notAnOpinion: 'レイシズムは意見ではない。ファシズムは選択肢ではない。',
  },
  anthem: '恐れないで',
  creditTitle: 'TREK 4.0.0 — 開かれた世界のために。',
  creditBody: 'レイシズム、憎しみ、ファシズムに抗して。旅は見知らぬ人を隣人に変える。',
  inspiredBy: 'Danger Dan「Keine Angst」に着想を得て',
  close: '受け継いでいく',
  skip: 'スキップ',
  soundOn: '音を出す',
  soundOff: '音を消す',
}

const ko: NoFearCopy = {
  beaconTitle: '두려워하지 마',
  beaconSub: '열린 세상을 위한 신호.',
  beaconCta: '재생을 눌러요.',
  lines: {
    afraid: '그들은 당신이 두려워하길 바랍니다.',
    ofTheStranger: '낯선 사람을 두려워하고, 알지 못하는 모든 것을 두려워하기를.',
    fearTool: '두려움은 국경을 닫습니다 — 처음엔 지도에서, 그다음엔 마음속에서.',
    hateTrade: '두려움은 그들의 도구이고, 증오는 그들의 장사입니다.',
    butYouTraveled: '하지만 당신은 여행을 했습니다.',
    tables: '낯선 식탁에서 밥을 먹고, 낯선 지붕 아래 잠들고, 낯선 사람들과 웃었습니다.',
    face: '당신은 압니다. 낯선 이에게도 얼굴이 있고, 그 얼굴이 당신을 닮았다는 것을.',
    fences: '세상을 본 사람이라면 누구도 그것을 다시 울타리 뒤에 가두고 싶어 하지 않습니다.',
    notAnOpinion: '인종차별은 의견이 아닙니다. 파시즘은 대안이 아닙니다.',
  },
  anthem: '두려워하지 마',
  creditTitle: 'TREK 4.0.0 — 열린 세상을 위하여.',
  creditBody: '인종차별, 증오, 파시즘에 반대하며. 여행은 낯선 사람을 이웃으로 만듭니다.',
  inspiredBy: 'Danger Dan의 「Keine Angst」에서 영감을 받아',
  close: '이어가기',
  skip: '건너뛰기',
  soundOn: '소리 켜기',
  soundOff: '소리 끄기',
}

const zh: NoFearCopy = {
  beaconTitle: '别害怕',
  beaconSub: '为开放世界而立的标记。',
  beaconCta: '按下播放。',
  lines: {
    afraid: '他们想让你害怕。',
    ofTheStranger: '害怕陌生人，害怕一切你不了解的东西。',
    fearTool: '因为恐惧会关闭边界——先是在地图上，然后是在头脑里。',
    hateTrade: '恐惧是他们的工具，仇恨是他们的生意。',
    butYouTraveled: '但你旅行过。',
    tables: '你曾在陌生的餐桌旁吃饭，在陌生的屋檐下入睡，与陌生人一起欢笑。',
    face: '你知道：陌生人也有一张脸，而那张脸和你的很像。',
    fences: '见过世界的人，没有谁愿意再把它锁回栅栏之后。',
    notAnOpinion: '种族主义不是一种观点。法西斯主义不是一种选择。',
  },
  anthem: '别害怕',
  creditTitle: 'TREK 4.0.0 — 为了一个开放的世界。',
  creditBody: '反对种族主义、仇恨与法西斯主义。旅行让陌生人成为邻居。',
  inspiredBy: '灵感来自 Danger Dan——《Keine Angst》',
  close: '传递下去',
  skip: '跳过',
  soundOn: '开启声音',
  soundOff: '关闭声音',
}

const zhTW: NoFearCopy = {
  beaconTitle: '別害怕',
  beaconSub: '為開放世界而立的標記。',
  beaconCta: '按下播放。',
  lines: {
    afraid: '他們想讓你害怕。',
    ofTheStranger: '害怕陌生人，害怕一切你不了解的事物。',
    fearTool: '因為恐懼會關閉邊界——先是在地圖上，然後是在腦海裡。',
    hateTrade: '恐懼是他們的工具，仇恨是他們的生意。',
    butYouTraveled: '但你旅行過。',
    tables: '你曾在陌生的餐桌旁吃飯，在陌生的屋簷下入睡，與陌生人一起歡笑。',
    face: '你知道：陌生人也有一張臉，而那張臉和你的很像。',
    fences: '見過世界的人，沒有誰願意再把它鎖回柵欄之後。',
    notAnOpinion: '種族主義不是一種觀點。法西斯主義不是一種選項。',
  },
  anthem: '別害怕',
  creditTitle: 'TREK 4.0.0 — 為了一個開放的世界。',
  creditBody: '反對種族主義、仇恨與法西斯主義。旅行讓陌生人成為鄰居。',
  inspiredBy: '靈感來自 Danger Dan——《Keine Angst》',
  close: '傳遞下去',
  skip: '跳過',
  soundOn: '開啟聲音',
  soundOff: '關閉聲音',
}

const ar: NoFearCopy = {
  beaconTitle: 'لا تخف',
  beaconSub: 'علامة من أجل عالم مفتوح.',
  beaconCta: 'اضغط تشغيل.',
  lines: {
    afraid: 'يريدونك أن تخاف.',
    ofTheStranger: 'أن تخاف من الغريب. أن تخاف من كل ما لا تعرفه.',
    fearTool: 'لأن الخوف يغلق الحدود — أولًا على الخرائط، ثم في العقول.',
    hateTrade: 'الخوف أداتهم. والكراهية تجارتهم.',
    butYouTraveled: 'لكنك سافرت.',
    tables: 'أكلت على موائد غريبة. نمت تحت سقوف غريبة. ضحكت مع غرباء.',
    face: 'أنت تعرف: للغريب وجه. وهو يشبه وجهك.',
    fences: 'لا أحد رأى العالم يريد أن يحبسه خلف الأسوار من جديد.',
    notAnOpinion: 'العنصرية ليست رأيًا. الفاشية ليست بديلًا.',
  },
  anthem: 'لا تخف',
  creditTitle: 'TREK 4.0.0 — من أجل عالم مفتوح.',
  creditBody: 'ضد العنصرية والكراهية والفاشية. السفر يحوّل الغرباء إلى جيران.',
  inspiredBy: 'مستوحى من Danger Dan — «Keine Angst»',
  close: 'احمله معك',
  skip: 'تخطَّ',
  soundOn: 'تشغيل الصوت',
  soundOff: 'كتم الصوت',
}

const COPY: Record<string, NoFearCopy> = {
  en, de, es, fr, it, nl, pl, ru, uk, cs, sv, tr, gr, hu, br, ca, id, vi, ja, ko, zh, ar,
  'zh-TW': zhTW,
}

export function noFearCopy(language: string): NoFearCopy {
  return COPY[language] ?? en
}

/**
 * "No fear" in every language TREK speaks — the anthem cascade. The German song
 * sparked this, but the message belongs to everyone, so it closes in all 23.
 */
export const ANTHEM_CASCADE: { lang: string; text: string }[] = [
  { lang: 'de', text: 'Keine Angst' },
  { lang: 'en', text: 'No fear' },
  { lang: 'uk', text: 'Без страху' },
  { lang: 'fr', text: 'Sans peur' },
  { lang: 'es', text: 'Sin miedo' },
  { lang: 'ar', text: 'لا تخف' },
  { lang: 'it', text: 'Senza paura' },
  { lang: 'pl', text: 'Bez strachu' },
  { lang: 'tr', text: 'Korkma' },
  { lang: 'nl', text: 'Geen angst' },
  { lang: 'gr', text: 'Χωρίς φόβο' },
  { lang: 'ja', text: '恐れないで' },
  { lang: 'br', text: 'Sem medo' },
  { lang: 'ko', text: '두려워하지 마' },
  { lang: 'cs', text: 'Beze strachu' },
  { lang: 'zh', text: '别害怕' },
  { lang: 'sv', text: 'Ingen rädsla' },
  { lang: 'vi', text: 'Đừng sợ' },
  { lang: 'hu', text: 'Ne félj' },
  { lang: 'id', text: 'Jangan takut' },
  { lang: 'ca', text: 'Sense por' },
  { lang: 'ru', text: 'Без страха' },
  { lang: 'zh-TW', text: '別害怕' },
]

export const INSPIRED_URL = 'https://www.youtube.com/watch?v=Gg-SCpXba64'
