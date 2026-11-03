import { ShieldCheck } from 'lucide-react';
import { useFormatDate } from '../../../hooks/useDateFormat';
import { fs } from '../../shared/DialogShell';
import type { VersionInfo } from './pluginModel';

/** A version number with its date and, when the author signed it, a quiet tick. */
export default function VersionLine({ v }: { v: VersionInfo }) {
  const { formatDate } = useFormatDate();
  return (
    <span className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
      <span
        className={`font-geist font-semibold tabular-nums ${v.compatible ? 'text-content' : 'text-content-faint'}`}
        style={fs(12.5)}
      >
        v{v.version}
      </span>
      {v.publishedAt && (
        <span className="text-content-faint" style={fs(11.5)}>
          {formatDate(new Date(v.publishedAt))}
        </span>
      )}
      {v.signed && <ShieldCheck size={13} className="flex-none text-success" />}
    </span>
  );
}
