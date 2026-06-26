import type { TranslationStrings } from '../types';

const packing: TranslationStrings = {
  'packing.title': 'Packlista',
  'packing.empty': 'Packlistan är tom',
  'packing.import': 'Importera',
  'packing.importTitle': 'Importera packlista',
  'packing.importHint':
    'Ett föremål per rad. Format: Kategori, Namn, Vikt i g (valfritt), Påse (valfritt)',
  'packing.importPlaceholder':
    'Hygiene, tandborste\nKläder, T-shirts, 200\nDokument, pass, handbagage\nElektronik, laddare, 50, resväska',
  'packing.importCsv': 'Ladda CSV/TXT',
  'packing.importAction': 'Importera {count}',
  'packing.importSuccess': '{count} föremål imported',
  'packing.importError': 'Importen misslyckades',
  'packing.importEmpty': 'Inga föremål att importera',
  'packing.progress': '{packed} av {total} packade ({percent}%)',
  'packing.clearChecked': 'Ta bort {count} markerade',
  'packing.clearCheckedShort': 'Ta bort {count}',
  'packing.suggestions': 'Förslag',
  'packing.suggestionsTitle': 'Lägg till förslag',
  'packing.allSuggested': 'All förslag tillagd',
  'packing.allPacked': 'Allt packat!',
  'packing.addPlaceholder': 'Lägg till nytt föremål',
  'packing.categoryPlaceholder': 'Kategori...',
  'packing.filterAll': 'Alla',
  'packing.filterOpen': 'Öppna',
  'packing.filterDone': 'Klar',
  'packing.emptyTitle': 'Packlistan är tom',
  'packing.emptyHint': 'Lägg till föremål eller använd förslagen',
  'packing.emptyFiltered': 'Inga föremål matchar detta filter',
  'packing.menuRename': 'Döp om',
  'packing.menuCheckAll': 'Markera alla',
  'packing.menuUncheckAll': 'Avmarkera alla',
  'packing.menuDeleteCat': 'Ta bort kategori',
  'packing.noMembers': 'Inga resedeltagare',
  'packing.addItem': 'Lägg till föremål',
  'packing.addItemPlaceholder': 'Föremålsnamn...',
  'packing.addCategory': 'Lägg till kategori',
  'packing.newCategoryPlaceholder': 'Kategorinamn (t.ex. kläder)',
  'packing.applyTemplate': 'Använd mall',
  'packing.template': 'Mall',
  'packing.templateApplied': '{count} föremål tillagda från mallen',
  'packing.templateError': 'Det gick inte att tillämpa mallen',
  'packing.saveAsTemplate': 'Spara som mall',
  'packing.templateName': 'Mallnamn',
  'packing.templateSaved': 'Packlista sparad som mall',
  'packing.bags': 'Väskor',
  'packing.noBag': 'Ej tilldelad',
  'packing.totalWeight': 'Totalvikt',
  'packing.bagName': 'Väskans namn...',
  'packing.addBag': 'Lägg till väska',
  'packing.changeCategory': 'Ändra kategori',
  'packing.confirm.clearChecked': 'Är du säker att du vill ta bort {count} markerade föremål?',
  'packing.confirm.deleteCat': 'Är du säker att du vill ta bort kategori "{name}" med {count} föremål?',
  'packing.defaultCategory': 'Övrigt',
  'packing.toast.saveError': 'Kunde inte spara',
  'packing.toast.deleteError': 'Kunde inte ta bort',
  'packing.toast.renameError': 'Kunde inte döpa om',
  'packing.toast.addError': 'Kunde inte lägga till',
  'packing.suggestions.items': [
    {
      name: 'Pass',
      category: 'Dokument',
    },
    {
      name: 'ID-kort',
      category: 'Dokument',
    },
    {
      name: 'Reseförsäkring',
      category: 'Dokument',
    },
    {
      name: 'Flygbiljetter',
      category: 'Dokument',
    },
    {
      name: 'Kreditkort',
      category: 'Ekonomi',
    },
    {
      name: 'Kontanter',
      category: 'Ekonomi',
    },
    {
      name: 'Visum',
      category: 'Dokument',
    },
    {
      name: 'T-shirts',
      category: 'Kläder',
    },
    {
      name: 'Byxor',
      category: 'Kläder',
    },
    {
      name: 'Underkläder',
      category: 'Kläder',
    },
    {
      name: 'Strumpor',
      category: 'Kläder',
    },
    {
      name: 'Jacka',
      category: 'Kläder',
    },
    {
      name: 'Nattkläder',
      category: 'Kläder',
    },
    {
      name: 'Badkläder',
      category: 'Kläder',
    },
    {
      name: 'Regnjacka',
      category: 'Kläder',
    },
    {
      name: 'Bekväma skor',
      category: 'Kläder',
    },
    {
      name: 'Tandborste',
      category: 'Toalettartiklar',
    },
    {
      name: 'Tandkräm',
      category: 'Toalettartiklar',
    },
    {
      name: 'Schampo',
      category: 'Toalettartiklar',
    },
    {
      name: 'Deodorant',
      category: 'Toalettartiklar',
    },
    {
      name: 'Solskyddsmedel',
      category: 'Toalettartiklar',
    },
    {
      name: 'Rakhyvel',
      category: 'Toalettartiklar',
    },
    {
      name: 'Laddare',
      category: 'Elektronik',
    },
    {
      name: 'Powerbank',
      category: 'Elektronik',
    },
    {
      name: 'Hörlurar',
      category: 'Elektronik',
    },
    {
      name: 'Resadapter',
      category: 'Elektronik',
    },
    {
      name: 'Kamera',
      category: 'Elektronik',
    },
    {
      name: 'Smärtstillande läkemedel',
      category: 'Hälsa',
    },
    {
      name: 'Plåster',
      category: 'Hälsa',
    },
    {
      name: 'Desinfektionsmedel',
      category: 'Hälsa',
    },
  ],
};
export default packing;
