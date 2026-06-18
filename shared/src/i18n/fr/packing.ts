import type { TranslationStrings } from '../types';

const packing: TranslationStrings = {
  'packing.title': 'Liste de bagages',
  'packing.empty': 'La liste de bagages est vide',
  'packing.import': 'Importer',
  'packing.importTitle': 'Importer la liste',
  'packing.importHint':
    'Un élément par ligne. Catégorie et quantité optionnelles séparées par virgule, point-virgule ou tabulation : Nom, Catégorie, Quantité',
  'packing.importPlaceholder': 'Brosse à dents\nCrème solaire, Hygiène\nT-Shirts, Vêtements, 5\nPasseport, Documents',
  'packing.importCsv': 'Charger CSV/TXT',
  'packing.importAction': 'Importer {count}',
  'packing.importSuccess': '{count} éléments importés',
  'packing.importError': "Échec de l'import",
  'packing.importEmpty': 'Aucun élément à importer',
  'packing.progress': '{packed} sur {total} emballés ({percent} %)',
  'packing.clearChecked': 'Supprimer {count} cochés',
  'packing.clearCheckedShort': 'Supprimer {count}',
  'packing.suggestions': 'Suggestions',
  'packing.suggestionsTitle': 'Ajouter des suggestions',
  'packing.allSuggested': 'Toutes les suggestions ajoutées',
  'packing.allPacked': 'Tout est emballé !',
  'packing.addPlaceholder': 'Ajouter un nouvel article…',
  'packing.categoryPlaceholder': 'Catégorie…',
  'packing.filterAll': 'Tous',
  'packing.filterOpen': 'À faire',
  'packing.filterDone': 'Fait',
  'packing.emptyTitle': 'La liste de bagages est vide',
  'packing.emptyHint': 'Ajoutez des articles ou utilisez les suggestions',
  'packing.emptyFiltered': 'Aucun article ne correspond à ce filtre',
  'packing.menuRename': 'Renommer',
  'packing.menuCheckAll': 'Tout cocher',
  'packing.menuUncheckAll': 'Tout décocher',
  'packing.menuDeleteCat': 'Supprimer la catégorie',
  'packing.addItem': 'Ajouter un article',
  'packing.addItemPlaceholder': "Nom de l'article...",
  'packing.addCategory': 'Ajouter une catégorie',
  'packing.newCategoryPlaceholder': 'Nom de catégorie (ex. Vêtements)',
  'packing.applyTemplate': 'Appliquer un modèle',
  'packing.template': 'Modèle',
  'packing.templateApplied': '{count} articles ajoutés depuis le modèle',
  'packing.templateError': "Erreur lors de l'application du modèle",
  'packing.saveAsTemplate': 'Enregistrer comme modèle',
  'packing.templateName': 'Nom du modèle',
  'packing.templateSaved': 'Liste de voyage enregistrée comme modèle',
  'packing.noMembers': 'Aucun membre',
  'packing.bags': 'Bagages',
  'packing.noBag': 'Non assigné',
  'packing.totalWeight': 'Poids total',
  'packing.bagName': 'Nom...',
  'packing.addBag': 'Ajouter un bagage',
  'packing.changeCategory': 'Changer de catégorie',
  'packing.confirm.clearChecked': 'Voulez-vous vraiment supprimer {count} articles cochés ?',
  'packing.confirm.deleteCat': 'Voulez-vous vraiment supprimer la catégorie « {name} » avec {count} articles ?',
  'packing.defaultCategory': 'Autre',
  'packing.toast.saveError': "Échec de l'enregistrement",
  'packing.toast.deleteError': 'Échec de la suppression',
  'packing.toast.renameError': 'Échec du renommage',
  'packing.toast.addError': "Échec de l'ajout",
  'packing.suggestions.items': [
    {
      name: 'Passeport',
      category: 'Documents',
    },
    {
      name: "Carte d'identité",
      category: 'Documents',
    },
    {
      name: 'Assurance voyage',
      category: 'Documents',
    },
    {
      name: "Billets d'avion",
      category: 'Documents',
    },
    {
      name: 'Carte bancaire',
      category: 'Finances',
    },
    {
      name: 'Espèces',
      category: 'Finances',
    },
    {
      name: 'Visa',
      category: 'Documents',
    },
    {
      name: 'T-shirts',
      category: 'Vêtements',
    },
    {
      name: 'Pantalons',
      category: 'Vêtements',
    },
    {
      name: 'Sous-vêtements',
      category: 'Vêtements',
    },
    {
      name: 'Chaussettes',
      category: 'Vêtements',
    },
    {
      name: 'Veste',
      category: 'Vêtements',
    },
    {
      name: 'Pyjama',
      category: 'Vêtements',
    },
    {
      name: 'Maillot de bain',
      category: 'Vêtements',
    },
    {
      name: 'Imperméable',
      category: 'Vêtements',
    },
    {
      name: 'Chaussures confortables',
      category: 'Vêtements',
    },
    {
      name: 'Brosse à dents',
      category: 'Hygiène',
    },
    {
      name: 'Dentifrice',
      category: 'Hygiène',
    },
    {
      name: 'Shampooing',
      category: 'Hygiène',
    },
    {
      name: 'Déodorant',
      category: 'Hygiène',
    },
    {
      name: 'Crème solaire',
      category: 'Hygiène',
    },
    {
      name: 'Rasoir',
      category: 'Hygiène',
    },
    {
      name: 'Chargeur',
      category: 'Électronique',
    },
    {
      name: 'Batterie externe',
      category: 'Électronique',
    },
    {
      name: 'Écouteurs',
      category: 'Électronique',
    },
    {
      name: 'Adaptateur de voyage',
      category: 'Électronique',
    },
    {
      name: 'Appareil photo',
      category: 'Électronique',
    },
    {
      name: 'Antidouleurs',
      category: 'Santé',
    },
    {
      name: 'Pansements',
      category: 'Santé',
    },
    {
      name: 'Désinfectant',
      category: 'Santé',
    },
  ],
};
export default packing;
