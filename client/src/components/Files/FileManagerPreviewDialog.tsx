import { Download, ExternalLink, FileText } from 'lucide-react';
import type { ReactNode } from 'react';
import { useId } from 'react';
import type { DialogShellProps } from '../shared/DialogShell';
import { DialogHeader, DialogShell, DialogTile, NEUTRAL_TINT, PILL } from '../shared/DialogShell';
import { triggerDownload } from './FileManager.helpers';

interface FilePreviewDialogProps {
  /** The file's name, on the head band. */
  name: string;
  /** The stored url the download pill fetches. */
  url: string;
  onClose: () => void;
  onOpenInTab: () => void;
  t: (key: string) => string;
  width: DialogShellProps['width'];
  bodyClassName: string;
  /** The colour of the file icon on the tile. */
  iconClassName: string;
  children: ReactNode;
}

/**
 * The dialog a file is read in: its name on the head band, open in a new tab
 * and download beside it. Each preview brings its own body.
 */
export function FilePreviewDialog({
  name,
  url,
  onClose,
  onOpenInTab,
  t,
  width,
  bodyClassName,
  iconClassName,
  children,
}: FilePreviewDialogProps) {
  const labelId = useId();
  return (
    <DialogShell
      onClose={onClose}
      labelledBy={labelId}
      width={width}
      bodyClassName={bodyClassName}
      header={
        <DialogHeader
          tile={
            <DialogTile>
              <FileText size={20} strokeWidth={1.9} className={iconClassName} />
            </DialogTile>
          }
          tint={NEUTRAL_TINT}
          labelId={labelId}
          onClose={onClose}
          title={name}
          pills={
            <>
              <button type="button" onClick={onOpenInTab} className={`${PILL} hover:opacity-80`}>
                <ExternalLink size={13} strokeWidth={2.2} /> {t('files.openTab')}
              </button>
              <button type="button" onClick={() => triggerDownload(url, name)} className={`${PILL} hover:opacity-80`}>
                <Download size={13} strokeWidth={2.2} /> {t('files.download') || 'Download'}
              </button>
            </>
          }
        />
      }
    >
      {children}
    </DialogShell>
  );
}
