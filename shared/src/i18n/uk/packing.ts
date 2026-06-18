import type { TranslationStrings } from '../types';

const packing: TranslationStrings = {
  'packing.title': 'Список речей',
  'packing.empty': 'Список речей порожній',
  'packing.import': 'Імпорт',
  'packing.importTitle': 'Імпорт списку речей',
  'packing.importHint':
    'Один предмет у рядок. Категорію та кількість — через кому, крапку з комою або табуляцію: Назва, Категорія, Кількість',
  'packing.importPlaceholder': 'Зубна щітка\nСонцезахисний крем, Гігієна\nФутболки, Одяг, 5\nПаспорт, Документи',
  'packing.importCsv': 'Завантажити CSV/TXT',
  'packing.importAction': 'Імпортувати {count}',
  'packing.importSuccess': '{count} предметів імпортовано',
  'packing.importError': 'Помилка імпорту',
  'packing.importEmpty': 'Немає предметів для імпорту',
  'packing.progress': '{packed} з {total} зібрано ({percent}%)',
  'packing.clearChecked': 'Видалити {count} позначених',
  'packing.clearCheckedShort': 'Видалити {count}',
  'packing.suggestions': 'Підказки',
  'packing.suggestionsTitle': 'Додати підказки',
  'packing.allSuggested': 'Усі підказки додано',
  'packing.allPacked': 'Усе зібрано!',
  'packing.addPlaceholder': 'Додати річ...',
  'packing.categoryPlaceholder': 'Категорія...',
  'packing.filterAll': 'Усі',
  'packing.filterOpen': 'Не зібрано',
  'packing.filterDone': 'Зібрано',
  'packing.emptyTitle': 'Список речей порожній',
  'packing.emptyHint': 'Додайте речі або використайте підказки',
  'packing.emptyFiltered': 'Немає речей, що відповідають фільтру',
  'packing.menuRename': 'Перейменувати',
  'packing.menuCheckAll': 'Позначити все',
  'packing.menuUncheckAll': 'Зняти позначки',
  'packing.menuDeleteCat': 'Видалити категорію',
  'packing.addItem': 'Додати річ',
  'packing.addItemPlaceholder': 'Назва...',
  'packing.addCategory': 'Додати категорію',
  'packing.newCategoryPlaceholder': 'Назва категорії (наприклад, Одяг)',
  'packing.applyTemplate': 'Застосувати шаблон',
  'packing.template': 'Шаблон',
  'packing.templateApplied': '{count} речей додано з шаблону',
  'packing.templateError': 'Помилка застосування шаблону',
  'packing.saveAsTemplate': 'Зберегти як шаблон',
  'packing.templateName': 'Назва шаблону',
  'packing.templateSaved': 'Список речей збережено як шаблон',
  'packing.noMembers': 'Немає учасників',
  'packing.bags': 'Багаж',
  'packing.noBag': 'Не призначено',
  'packing.totalWeight': 'Загальна вага',
  'packing.bagName': 'Назва...',
  'packing.addBag': 'Додати багаж',
  'packing.changeCategory': 'Змінити категорію',
  'packing.confirm.clearChecked': 'Ви впевнені, що хочете видалити {count} позначених речей?',
  'packing.confirm.deleteCat': 'Ви впевнені, що хочете видалити категорію «{name}» з {count} речами?',
  'packing.defaultCategory': 'Інше',
  'packing.toast.saveError': 'Помилка збереження',
  'packing.toast.deleteError': 'Помилка видалення',
  'packing.toast.renameError': 'Помилка перейменування',
  'packing.toast.addError': 'Помилка додавання',
  'packing.suggestions.items': [
    {
      name: 'Паспорт',
      category: 'Документи',
    },
    {
      name: 'Посвідчення особи',
      category: 'Документи',
    },
    {
      name: 'Страхування',
      category: 'Документи',
    },
    {
      name: 'Авіаквитки',
      category: 'Документи',
    },
    {
      name: 'Банківська картка',
      category: 'Фінанси',
    },
    {
      name: 'Готівка',
      category: 'Фінанси',
    },
    {
      name: 'Віза',
      category: 'Документи',
    },
    {
      name: 'Футболки',
      category: 'Одяг',
    },
    {
      name: 'Штани',
      category: 'Одяг',
    },
    {
      name: 'Нижня білизна',
      category: 'Одяг',
    },
    {
      name: 'Шкарпетки',
      category: 'Одяг',
    },
    {
      name: 'Куртка',
      category: 'Одяг',
    },
    {
      name: 'Піжама',
      category: 'Одяг',
    },
    {
      name: 'Купальник',
      category: 'Одяг',
    },
    {
      name: 'Дощовик',
      category: 'Одяг',
    },
    {
      name: 'Зручне взуття',
      category: 'Одяг',
    },
    {
      name: 'Зубна щітка',
      category: 'Гігієна',
    },
    {
      name: 'Зубна паста',
      category: 'Гігієна',
    },
    {
      name: 'Шампунь',
      category: 'Гігієна',
    },
    {
      name: 'Дезодорант',
      category: 'Гігієна',
    },
    {
      name: 'Сонцезахисний крем',
      category: 'Гігієна',
    },
    {
      name: 'Пасок',
      category: 'Гігієна',
    },
    {
      name: 'Зарядний пристрій',
      category: 'Електроніка',
    },
    {
      name: 'Зовнішній акумулятор',
      category: 'Електроніка',
    },
    {
      name: 'Навушники',
      category: 'Електроніка',
    },
    {
      name: 'Адаптер для розеток',
      category: 'Електроніка',
    },
    {
      name: 'Фотоапарат',
      category: 'Електроніка',
    },
    {
      name: 'Знеболювальні',
      category: 'Здоров’я',
    },
    {
      name: 'Пластирі',
      category: 'Здоров’я',
    },
    {
      name: 'Антисептик',
      category: 'Здоров’я',
    },
  ],
};
export default packing;
