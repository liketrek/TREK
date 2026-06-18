import type { TranslationStrings } from '../types';

const packing: TranslationStrings = {
  'packing.title': '行李清单',
  'packing.empty': '行李清单为空',
  'packing.import': '导入',
  'packing.importTitle': '导入装箱清单',
  'packing.importHint': '每行一个物品。可选用逗号、分号或制表符分隔类别和数量：名称, 类别, 数量',
  'packing.importPlaceholder': '牙刷\n防晒霜, 卫生\nT恤, 衣物, 5\n护照, 证件',
  'packing.importCsv': '加载 CSV/TXT',
  'packing.importAction': '导入 {count}',
  'packing.importSuccess': '已导入 {count} 项',
  'packing.importError': '导入失败',
  'packing.importEmpty': '没有可导入的项目',
  'packing.progress': '已打包 {packed}/{total}（{percent}%）',
  'packing.clearChecked': '移除 {count} 个已勾选',
  'packing.clearCheckedShort': '移除 {count} 个',
  'packing.suggestions': '建议',
  'packing.suggestionsTitle': '添加建议',
  'packing.allSuggested': '所有建议已添加',
  'packing.allPacked': '全部打包完成！',
  'packing.addPlaceholder': '添加新物品...',
  'packing.categoryPlaceholder': '分类...',
  'packing.filterAll': '全部',
  'packing.filterOpen': '未完成',
  'packing.filterDone': '已完成',
  'packing.emptyTitle': '行李清单为空',
  'packing.emptyHint': '添加物品或使用建议',
  'packing.emptyFiltered': '没有匹配的物品',
  'packing.menuRename': '重命名',
  'packing.menuCheckAll': '全部勾选',
  'packing.menuUncheckAll': '取消全部勾选',
  'packing.menuDeleteCat': '删除分类',
  'packing.addItem': '添加物品',
  'packing.addItemPlaceholder': '物品名称...',
  'packing.addCategory': '添加分类',
  'packing.newCategoryPlaceholder': '分类名称（如：衣物）',
  'packing.applyTemplate': '应用模板',
  'packing.template': '模板',
  'packing.templateApplied': '已从模板添加 {count} 个物品',
  'packing.templateError': '应用模板失败',
  'packing.saveAsTemplate': '保存为模板',
  'packing.templateName': '模板名称',
  'packing.templateSaved': '行李清单已保存为模板',
  'packing.noMembers': '无成员',
  'packing.bags': '行李',
  'packing.noBag': '未分配',
  'packing.totalWeight': '总重量',
  'packing.bagName': '名称...',
  'packing.addBag': '添加行李',
  'packing.changeCategory': '更改分类',
  'packing.confirm.clearChecked': '确定移除 {count} 个已勾选的物品？',
  'packing.confirm.deleteCat': '确定删除分类「{name}」及其 {count} 个物品？',
  'packing.defaultCategory': '其他',
  'packing.toast.saveError': '保存失败',
  'packing.toast.deleteError': '删除失败',
  'packing.toast.renameError': '重命名失败',
  'packing.toast.addError': '添加失败',
  'packing.suggestions.items': [
    {
      name: '护照',
      category: '证件',
    },
    {
      name: '身份证',
      category: '证件',
    },
    {
      name: '旅行保险',
      category: '证件',
    },
    {
      name: '机票',
      category: '证件',
    },
    {
      name: '信用卡',
      category: '财务',
    },
    {
      name: '现金',
      category: '财务',
    },
    {
      name: '签证',
      category: '证件',
    },
    {
      name: 'T恤',
      category: '衣物',
    },
    {
      name: '裤子',
      category: '衣物',
    },
    {
      name: '内衣',
      category: '衣物',
    },
    {
      name: '袜子',
      category: '衣物',
    },
    {
      name: '外套',
      category: '衣物',
    },
    {
      name: '睡衣',
      category: '衣物',
    },
    {
      name: '泳衣',
      category: '衣物',
    },
    {
      name: '雨衣',
      category: '衣物',
    },
    {
      name: '舒适的鞋子',
      category: '衣物',
    },
    {
      name: '牙刷',
      category: '洗漱用品',
    },
    {
      name: '牙膏',
      category: '洗漱用品',
    },
    {
      name: '洗发水',
      category: '洗漱用品',
    },
    {
      name: '除臭剂',
      category: '洗漱用品',
    },
    {
      name: '防晒霜',
      category: '洗漱用品',
    },
    {
      name: '剃须刀',
      category: '洗漱用品',
    },
    {
      name: '充电器',
      category: '电子产品',
    },
    {
      name: '充电宝',
      category: '电子产品',
    },
    {
      name: '耳机',
      category: '电子产品',
    },
    {
      name: '旅行转换插头',
      category: '电子产品',
    },
    {
      name: '相机',
      category: '电子产品',
    },
    {
      name: '止痛药',
      category: '健康',
    },
    {
      name: '创可贴',
      category: '健康',
    },
    {
      name: '消毒液',
      category: '健康',
    },
  ],
};
export default packing;
