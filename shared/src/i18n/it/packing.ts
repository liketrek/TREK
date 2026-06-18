import type { TranslationStrings } from '../types';

const packing: TranslationStrings = {
  'packing.title': 'Lista valigia',
  'packing.empty': 'La lista valigia è vuota',
  'packing.import': 'Importa',
  'packing.importTitle': 'Importa lista valigia',
  'packing.importHint':
    'Un elemento per riga. Formato: Categoria, Nome, Peso in g (opzionale), Borsa (opzionale), checked/unchecked (opzionale)',
  'packing.importPlaceholder':
    'Igiene, Spazzolino\nAbbigliamento, Magliette, 200\nDocumenti, Passaporto, , Bagaglio a mano\nElettronica, Caricabatterie, 50, Valigia, checked',
  'packing.importCsv': 'Carica CSV/TXT',
  'packing.importAction': 'Importa {count}',
  'packing.importSuccess': '{count} elementi importati',
  'packing.importError': 'Importazione non riuscita',
  'packing.importEmpty': 'Nessun elemento da importare',
  'packing.progress': '{packed} di {total} in valigia ({percent}%)',
  'packing.clearChecked': 'Rimuovi {count} spuntati',
  'packing.clearCheckedShort': 'Rimuovi {count}',
  'packing.suggestions': 'Suggerimenti',
  'packing.suggestionsTitle': 'Aggiungi suggerimenti',
  'packing.allSuggested': 'Tutti i suggerimenti aggiunti',
  'packing.allPacked': 'Tutto in valigia!',
  'packing.addPlaceholder': 'Aggiungi nuovo elemento...',
  'packing.categoryPlaceholder': 'Categoria...',
  'packing.filterAll': 'Tutti',
  'packing.filterOpen': 'Da fare',
  'packing.filterDone': 'Fatto',
  'packing.emptyTitle': 'La lista valigia è vuota',
  'packing.emptyHint': 'Aggiungi elementi o usa i suggerimenti',
  'packing.emptyFiltered': 'Nessun elemento corrisponde a questo filtro',
  'packing.menuRename': 'Rinomina',
  'packing.menuCheckAll': 'Seleziona tutti',
  'packing.menuUncheckAll': 'Deseleziona tutti',
  'packing.menuDeleteCat': 'Elimina categoria',
  'packing.noMembers': 'Nessun membro del viaggio',
  'packing.addItem': 'Aggiungi elemento',
  'packing.addItemPlaceholder': 'Nome elemento...',
  'packing.addCategory': 'Aggiungi categoria',
  'packing.newCategoryPlaceholder': 'Nome categoria (es. Abbigliamento)',
  'packing.applyTemplate': 'Applica modello',
  'packing.template': 'Modello',
  'packing.templateApplied': '{count} elementi aggiunti dal modello',
  'packing.templateError': 'Impossibile applicare il modello',
  'packing.saveAsTemplate': 'Salva come modello',
  'packing.templateName': 'Nome modello',
  'packing.templateSaved': 'Lista bagagli salvata come modello',
  'packing.bags': 'Valigie',
  'packing.noBag': 'Non assegnato',
  'packing.totalWeight': 'Peso totale',
  'packing.bagName': 'Nome valigia...',
  'packing.addBag': 'Aggiungi valigia',
  'packing.changeCategory': 'Cambia categoria',
  'packing.confirm.clearChecked': 'Sei sicuro di voler rimuovere {count} elementi spuntati?',
  'packing.confirm.deleteCat': 'Sei sicuro di voler eliminare la categoria "{name}" con {count} elementi?',
  'packing.defaultCategory': 'Altro',
  'packing.toast.saveError': 'Impossibile salvare',
  'packing.toast.deleteError': 'Impossibile eliminare',
  'packing.toast.renameError': 'Impossibile rinominare',
  'packing.toast.addError': 'Impossibile aggiungere',
  'packing.suggestions.items': [
    {
      name: 'Passaporto',
      category: 'Documenti',
    },
    {
      name: "Carta d'identità",
      category: 'Documenti',
    },
    {
      name: 'Assicurazione di viaggio',
      category: 'Documenti',
    },
    {
      name: 'Biglietti aerei',
      category: 'Documenti',
    },
    {
      name: 'Carta di credito',
      category: 'Finanze',
    },
    {
      name: 'Contanti',
      category: 'Finanze',
    },
    {
      name: 'Visto',
      category: 'Documenti',
    },
    {
      name: 'Magliette',
      category: 'Abbigliamento',
    },
    {
      name: 'Pantaloni',
      category: 'Abbigliamento',
    },
    {
      name: 'Intimo',
      category: 'Abbigliamento',
    },
    {
      name: 'Calzini',
      category: 'Abbigliamento',
    },
    {
      name: 'Giacca',
      category: 'Abbigliamento',
    },
    {
      name: 'Pigiama',
      category: 'Abbigliamento',
    },
    {
      name: 'Costume da bagno',
      category: 'Abbigliamento',
    },
    {
      name: 'Giacca a vento',
      category: 'Abbigliamento',
    },
    {
      name: 'Scarpe comode',
      category: 'Abbigliamento',
    },
    {
      name: 'Spazzolino da denti',
      category: 'Igiene personale',
    },
    {
      name: 'Dentifricio',
      category: 'Igiene personale',
    },
    {
      name: 'Shampoo',
      category: 'Igiene personale',
    },
    {
      name: 'Deodorante',
      category: 'Igiene personale',
    },
    {
      name: 'Crema solare',
      category: 'Igiene personale',
    },
    {
      name: 'Rasoio',
      category: 'Igiene personale',
    },
    {
      name: 'Caricabatterie',
      category: 'Elettronica',
    },
    {
      name: 'Power bank',
      category: 'Elettronica',
    },
    {
      name: 'Cuffie',
      category: 'Elettronica',
    },
    {
      name: 'Adattatore da viaggio',
      category: 'Elettronica',
    },
    {
      name: 'Macchina fotografica',
      category: 'Elettronica',
    },
    {
      name: 'Antidolorifici',
      category: 'Salute',
    },
    {
      name: 'Cerotti',
      category: 'Salute',
    },
    {
      name: 'Disinfettante',
      category: 'Salute',
    },
  ],
};
export default packing;
