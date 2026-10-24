/**
 * Real Google Maps walking routes (CW-07), as their short links answered on
 * 2026-10-20: each `https://maps.app.goo.gl/<code>` gave one 302 straight to
 * the www.google.com/maps/dir link below, with no consent page in between.
 * Four walks through Porto shared by a travel blog; the query Google appends
 * (entry, g_ep, skid) is left off. Every one ends in `!3e2`, on foot.
 *
 * Two of them are the hard case for reading positions: PORTO_ALIADOS drags its
 * line through a point of its own between two stops, and PORTO_CLERIGOS does
 * that and has two stops given as coordinates, so a count of the coordinate
 * pairs no longer matches the stops.
 */
/** https://maps.app.goo.gl/G8RFU9t5AbTx3QEZA */
export const PORTO_CLERIGOS =
  'https://www.google.com/maps/dir/Igreja+de+Santo+Ant%C3%B3nio+dos+Congregados,+R.+de+S%C3%A1+da+Bande' +
  'ira+11,+4000-433+Porto,+Portugal/Torre+dos+Cl%C3%A9rigos,+R.+de+S%C3%A3o+Filipe+de+Nery,+4050-546+Po' +
  'rto,+Portugal/Livraria+Lello,+R.+das+Carmelitas+144,+4050-161+Porto,+Portugal/Igreja+do+Carmo,+R.+do' +
  '+Carmo,+4050-164+Porto,+Portugal/Restaurante+Carlos+Alberto,+Pra%C3%A7a+de+Carlos+Alberto+89,+4050-1' +
  '58+Porto,+Portugal/Miradouro+da+Vit%C3%B3ria,+R.+de+S%C3%A3o+Bento+da+Vit%C3%B3ria+11,+4050-265+Port' +
  'o,+Portugal/41.1442506,-8.6138221/Mercado+Ferreira+Borges,+R.+da+Bolsa+19,+4050-253+Porto,+Portugal/' +
  'Pal%C3%A1cio+da+Bolsa,+R.+de+Ferreira+Borges+11,+4050-253+Porto,+Portugal/41.1403376,-8.6145436/@41.' +
  '1443544,-8.6187204,1418m/data=!3m2!1e3!5s0xd2464e1c85c7cb9:0x8dcf9241515af39c!4m67!4m66!1m5!1m1!1s0x' +
  'd2464e386381dd9:0x71fe2c588c0e5d5c!2m2!1d-8.6107393!2d41.1461867!1m5!1m1!1s0xd2464e251ced649:0x425ec' +
  '51327127c21!2m2!1d-8.6145977!2d41.1456705!1m5!1m1!1s0xd2464e28c5e9a77:0x7f08405ee8a1e44f!2m2!1d-8.61' +
  '48718!2d41.1468104!1m5!1m1!1s0xd2464e2992d6fc9:0x14e81d436806274!2m2!1d-8.6162729!2d41.1473563!1m15!' +
  '1m1!1s0xd2464e2aef96389:0xfdd13b0f82024051!2m2!1d-8.6155251!2d41.1484332!3m4!1m2!1d-8.6175322!2d41.1' +
  '457355!3s0xd24651da106d14d:0x3fc8d2a99969c3c9!3m4!1m2!1d-8.6158595!2d41.1453503!3s0xd2464e271988c81:' +
  '0x9c8eada62d9eb19e!1m5!1m1!1s0xd2464e1fb67ccaf:0x83772eddb20da5!2m2!1d-8.6158324!2d41.1430829!1m5!3m' +
  '4!1m2!1d-8.6147197!2d41.1430656!3s0xd2464e1932b9b77:0x52ecdbda923433b2!1m5!1m1!1s0xd2464e1c90c863d:0' +
  'xbdf9a36d350cdbae!2m2!1d-8.615126!2d41.1419501!1m5!1m1!1s0xd2464e1c2820d41:0x69324171e40cd951!2m2!1d' +
  '-8.6156725!2d41.1413772!1m0!3e2';

/** https://maps.app.goo.gl/VigUDiFTi652ZJ58A */
export const PORTO_ALIADOS =
  'https://www.google.com/maps/dir/Sculpture+Dom+Pedro+IV/Porto+City+Hall,+PC+GEN+Humberto+Delgado,+404' +
  '9-001+Porto,+Portugal/Igreja+da+Sant%C3%ADssima+Trindade,+Pra%C3%A7a+Trindade+170,+4000-539+Porto,+P' +
  'ortugal/Chapel+of+Souls,+R.+de+Santa+Catarina+428,+4000-124+Porto,+Portugal/Majestic+Caf%C3%A9,+R.+d' +
  'e+Santa+Catarina+112,+4000-442+Porto,+Portugal/Jardim+Marques+de+Oliveira,+Passeio+de+S%C3%A3o+L%C3%' +
  'A1zaro+33,+4000-507+Porto,+Portugal/Church+of+Saint+Ildefonso,+Pra%C3%A7a+da+Batalha+s%2Fn,+4000-101' +
  '+Porto,+Portugal/Pra%C3%A7a+da+Batalha,+R.+de+Augusto+Rosa,+4000-529+Porto,+Portugal/Porto+S%C3%A3o+' +
  'Bento,+Pra%C3%A7a+de+Almeida+Garrett,+4000-069+Porto,+Portugal/@41.145893,-8.6093059,709m/data=!3m2!' +
  '1e3!5s0xd2464fb7b6cb07b:0x89f066ff0f3967a4!4m61!4m60!1m5!1m1!1s0x0:0x3ef7f76b5b4253d6!2m2!1d-8.61157' +
  '72!2d41.1463491!1m5!1m1!1s0xd2464fca6339107:0x5dc6096016a67879!2m2!1d-8.6107023!2d41.1499084!1m5!1m1' +
  '!1s0xd2464fb615293c7:0x7c79e721d53d0f87!2m2!1d-8.6105681!2d41.1508419!1m5!1m1!1s0xd2464faae719e5f:0x' +
  '11125f1ca37787b5!2m2!1d-8.6056554!2d41.1498821!1m5!1m1!1s0xd2464e5a52a2493:0x1dc3afde71cae5f4!2m2!1d' +
  '-8.6065795!2d41.1472382!1m5!1m1!1s0xd2464ef2191b9e3:0xb0d8f9ac36dd3f2c!2m2!1d-8.602522!2d41.1459635!' +
  '1m5!1m1!1s0xd2464e5bc4a1885:0x1d8d4eb48388fdc7!2m2!1d-8.6066989!2d41.1460999!1m10!1m1!1s0xd2464e6783' +
  'e9b1f:0xb97ba181af122779!2m2!1d-8.6070394!2d41.1451574!3m4!1m2!1d-8.6082184!2d41.1461502!3s0xd2464e4' +
  '44e45d6b:0xf1247bcc87b60d1d!1m5!1m1!1s0xd2464e4756ff947:0x124f921e49a8773e!2m2!1d-8.609544!2d41.1454' +
  '92!3e2';

/** https://maps.app.goo.gl/gwKHfs8TNxShEBBk7 */
export const PORTO_RIBEIRA =
  'https://www.google.com/maps/dir/Igreja+de+Santa+Clara,+Largo+Primeiro+de+Dezembro,+4000-404+Porto,+P' +
  'ortugal/Porto+Cathedral,+Terreiro+da+S%C3%A9,+4050-573+Porto,+Portugal/Mosteiro+Santo+Agostinho+da+S' +
  'erra+do+Pilar,+Largo+Aviz,+4430-329+Vila+Nova+de+Gaia,+Portugal/Mirador+de+Porto+y+Duero/Ribeira+de+' +
  'Gaia/@41.139645,-8.6121024,1418m/data=!3m2!1e3!5s0xd2464e7415940f5:0x9c2de86e34f7d338!4m32!4m31!1m5!' +
  '1m1!1s0xd2464e6c2a4163b:0xfde6dd68a1ab3e6c!2m2!1d-8.6092477!2d41.1425899!1m5!1m1!1s0xd2464e13991ebb9' +
  ':0x4a1cccaea07537e9!2m2!1d-8.6111165!2d41.1428531!1m5!1m1!1s0xd2464ddc3346ee7:0xab7221d21110d0a3!2m2' +
  '!1d-8.6075262!2d41.138298!1m5!1m1!1s0xd24657223ef3713:0xc8700250c6991029!2m2!1d-8.609616!2d41.139145' +
  '2!1m5!1m1!1s0xd2464de113e580d:0x7e3c5edb72fc8aa9!2m2!1d-8.6117899!2d41.1382776!3e2';

/** https://maps.app.goo.gl/sePQGivnkMLuTUd86 */
export const GAIA_CELLARS =
  'https://www.google.com/maps/dir/Mercado+Municipal+de+Gaia,+Largo+Sampaio+Bruno+10,+4400-161+Vila+Nov' +
  "a+de+Gaia,+Portugal/Cockburn's,+R.+de+Serpa+Pinto+346,+4400-307+Vila+Nova+de+Gaia,+Portugal/Croft+Po" +
  'rt/Arco+e+Meio+-+Portuguese+Wine+Shop,+Tv.+de+C%C3%A2ndido+dos+Reis+9,+4430-999+Vila+Nova+de+Gaia,+P' +
  'ortugal/@41.1352706,-8.620441,1418m/data=!3m2!1e3!4b1!4m26!4m25!1m5!1m1!1s0xd2465207829c837:0xa058d1' +
  '5855e35382!2m2!1d-8.6162726!2d41.1369384!1m5!1m1!1s0xd246520d2b824a3:0xe5019341caefb9df!2m2!1d-8.618' +
  '1478!2d41.133527!1m5!1m1!1s0xd246521b0dbd957:0x9a6db3995f97d21b!2m2!1d-8.615071!2d41.1349963!1m5!1m1' +
  '!1s0xd2464def5bfcab3:0xef35a43b60659b42!2m2!1d-8.6121984!2d41.1365006!3e2';
