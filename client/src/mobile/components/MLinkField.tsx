import { Check, Copy, Share as ShareIcon } from 'lucide-react';
import { canShareLink, shareLink } from '../../native/shareLink';

/** The round icon buttons next to the link: copy and share, the same size. */
const ACTION = 'flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full bg-m-act text-m-actfg';

/**
 * A link to hand on, read-only, with copy and (where the system has a share
 * sheet) share next to it: the trip's share and invite links and a journey's
 * public link all look the same.
 */
export default function MLinkField({
  url,
  copied,
  onCopy,
  copyLabel,
  copiedLabel,
  shareLabel,
}: {
  url: string;
  copied: boolean;
  onCopy: () => void;
  copyLabel: string;
  copiedLabel: string;
  shareLabel: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] py-1 pe-1 ps-[14px]">
      <input
        readOnly
        value={url}
        aria-label={url}
        className="min-w-0 flex-1 border-none bg-transparent font-geist text-[length:calc(11px*var(--fs-scale-caption,1))] text-m-muted outline-none"
      />
      <button type="button" aria-label={copied ? copiedLabel : copyLabel} onClick={onCopy} className={ACTION}>
        {copied ? <Check size={15} strokeWidth={2.4} /> : <Copy size={15} strokeWidth={2.2} />}
      </button>
      {canShareLink() && (
        <button type="button" aria-label={shareLabel} onClick={() => void shareLink(url)} className={ACTION}>
          <ShareIcon size={15} strokeWidth={2.2} />
        </button>
      )}
    </div>
  );
}
