import { ChevronDown, Plus } from 'lucide-react';
import type { MouseEvent } from 'react';
import { useTranslation } from '../../../i18n';
import { ContextMenu, useContextMenu } from '../../shared/ContextMenu';
import { DialogButton } from '../../shared/DialogShell';
import { tourDayHowItems, type TourDayHowInput } from './stageSpread';

/**
 * The detail's "Add to day" for the day selected in the plan. A day tour goes
 * on at once; a multi-day tour opens the two ways first, in a menu under the
 * button, so the choice is made where the day was.
 */
export function TourDayAddButton(input: TourDayHowInput) {
  const { placeId, dayId, stageCount, assignment } = input;
  const { t, locale } = useTranslation();
  const menu = useContextMenu();
  const staged = stageCount > 1;

  const onClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (!staged) {
      void assignment.assign(placeId, dayId);
      return;
    }
    if (menu.menu) {
      event.stopPropagation();
      menu.close();
      return;
    }
    menu.open(event, tourDayHowItems(input, t, locale), true);
  };

  return (
    <>
      <DialogButton
        variant="primary"
        onClick={onClick}
        disabled={!assignment.isAvailable(placeId, dayId, staged ? 'stages' : 'whole')}
        aria-haspopup={staged ? 'menu' : undefined}
        aria-expanded={staged ? !!menu.menu : undefined}
        icon={<Plus size={14} strokeWidth={2} />}
      >
        {t('inspector.addToDay')}
        {staged && (
          <ChevronDown
            size={13}
            strokeWidth={2.2}
            aria-hidden="true"
            className={`transition-transform ${menu.menu ? 'rotate-180' : ''}`}
          />
        )}
      </DialogButton>
      <ContextMenu menu={menu.menu} onClose={menu.close} />
    </>
  );
}
