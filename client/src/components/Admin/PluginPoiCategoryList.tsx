import { useTranslation } from '../../i18n'
import { declaredPoiCategories } from './pluginCaps'

/** The category's own colour with a white glyph on it, as the explore pill draws a chip that is on. */
const SWATCH = 'grid h-6 w-6 flex-none place-items-center rounded-full text-white shadow-sm' // theme-lint-disable: the glyph sits on the plugin's category colour, not on a theme surface

interface Props {
  pluginId: string
  /** The plugin's declared permissions: the list only shows with the grant that serves it. */
  permissions: readonly string[]
  /** `capabilities.poiCategories` as the registry sent it; checked again before drawing. */
  categories: unknown
  /** Where the section sits and how its heading and rows read are the shell's business. */
  className?: string
  titleClassName: string
  itemClassName: string
}

/**
 * The "Map categories it adds" section of a plugin's detail view (#1781), shared by
 * the desktop dialog and the phone sheet. Each row is drawn the way the chip looks
 * when it is switched on in the explore pill: the icon on the category colour, then
 * the label in the admin's language. The label only ever goes in as React text and
 * the colour only as a background value, so a plugin cannot put markup or styling of
 * its own into the panel.
 */
export default function PluginPoiCategoryList({ pluginId, permissions, categories, className, titleClassName, itemClassName }: Readonly<Props>) {
  const { t, language } = useTranslation()
  const declared = declaredPoiCategories(pluginId, permissions, categories, language)
  if (declared.length === 0) return null
  return (
    <div className={className}>
      <h4 className={titleClassName}>{t('admin.plugins.poiCategoriesTitle')}</h4>
      <ul className="m-0 mt-2 flex list-none flex-col gap-1.5 p-0">
        {declared.map(({ id, label, Icon, color }) => (
          <li key={id} className={`flex min-w-0 items-center gap-2.5 py-0.5 ${itemClassName}`}>
            <span aria-hidden="true" data-testid="poi-category-swatch"
              className={SWATCH}
              style={{ backgroundColor: color }}>
              <Icon size={13} strokeWidth={2} />
            </span>
            <span className="min-w-0 truncate">{label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
