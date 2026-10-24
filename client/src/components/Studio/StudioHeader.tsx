import { Check, ChevronDown, ClipboardPaste, Download, Redo2, Sparkles, Undo2, X } from 'lucide-react';
import { useEffect, useRef, useState, type RefObject } from 'react';
import { useStudioStore } from '../../store/studioStore';
import '../../styles/studio-head.css';
import HelpButton from '../Help/HelpButton';
import { Tooltip } from '../shared/Tooltip';
import { PAGE_PRESET_ORDER, PAGE_PRESETS } from './pagePresets';
import { PeerBadges } from './PeerBadges';
import { SaveIndicator } from './SaveIndicator';
import { StudioAssistantToggle } from './StudioAssistantPanel';
import type { Studio } from './StudioShell';
import { StudioWordmark } from './StudioWordmark';
import { TrimField } from './TrimField';
import type { StudioAssistant } from './useStudioAssistant';

/**
 * The Studio's head band, in the shape every TREK dialog has: a raised tile on
 * the left, the Studio's mark above the title, the title, a line under it, and
 * the close button at the far end.
 *
 * The tile is the journey's cover and the title its name, so it is always clear
 * whose book this is. The tools on the right are grouped by what they do:
 * who else is here and whether the book is saved, what the book is printed as, editing (undo, redo, paste), auto
 * layout, the assistant, help, and getting the book out. Every piece of
 * the row is one raised tile of one height, export alone in the accent. How
 * the page is looked at, the book view, lives with the zoom under the page.
 */
export function StudioHeader({
  s,
  onExport,
  assistant,
}: {
  s: Studio;
  onExport: () => void;
  assistant: StudioAssistant;
}) {
  return (
    <header className="st-bar st-head">
      <span className="st-head-tile">{s.coverUrl ? <img src={s.coverUrl} alt="" /> : null}</span>

      <div className="st-head-text">
        <div className="st-head-eyebrow">
          <StudioWordmark style={{ height: 17 }} />
        </div>
        <h1 className="st-head-title">{s.journey?.title || s.t('journey.title')}</h1>
      </div>

      <div className="st-head-tools">
        <PeerBadges peers={s.peers} t={s.t} />
        {/* Whether the book is safe, as a tile beside who else is here: both say how the book stands. */}
        <SaveIndicator
          state={s.saveState}
          t={s.t}
          onAcceptTheirs={(current) => s.loadDoc(s.acceptTheirs(current))}
          onKeepMine={s.keepMine}
          onRetry={() => {
            void s.saveNow();
          }}
        />

        <div className="st-head-group">
          <FormatPicker s={s} />
        </div>

        <div className="st-head-group">
          <IconTool label={s.t('journey.studio.undo')} disabled={!s.canUndo} onClick={s.undo}>
            <Undo2 size={15} />
          </IconTool>
          <IconTool label={s.t('journey.studio.redo')} disabled={!s.canRedo} onClick={s.redo}>
            <Redo2 size={15} />
          </IconTool>
          <PasteButton s={s} />
        </div>

        <div className="st-head-group">
          <AutoLayoutButton s={s} />
        </div>

        {/* The book's assistant, a tile of its own like help; only where it can run for this user. */}
        <StudioAssistantToggle assistant={assistant} />
        {/* Studio has no navbar, so the help center's button rides on its own bar. */}
        <HelpButton className="st-tool is-icon st-head-solo" />
        <button
          type="button"
          className="st-tool is-primary st-head-solo"
          onClick={onExport}
          disabled={!s.doc}
          title={s.t('journey.studio.export')}
        >
          <Download size={14} />
          <span className="st-tool-label">{s.t('journey.studio.export')}</span>
        </button>

        <Tooltip label={s.t('journey.studio.backToJourney')}>
          <button
            type="button"
            onClick={s.close}
            className="st-head-close"
            aria-label={s.t('journey.studio.backToJourney')}
          >
            <X size={16} strokeWidth={2.2} />
          </button>
        </Tooltip>
      </div>
    </header>
  );
}

function IconTool({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip label={label}>
      <button type="button" className="st-tool is-icon" disabled={disabled} onClick={onClick} aria-label={label}>
        {children}
      </button>
    </Tooltip>
  );
}

/**
 * Closes a popover on a pointer press outside it and on Escape. Escape is
 * swallowed, or the shell's own handler would close Studio itself.
 */
function useDismiss(box: RefObject<HTMLElement | null>, open: boolean, setOpen: (open: boolean) => void) {
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [box, open, setOpen]);
}

/**
 * Paste what was copied onto the page on screen (#2316). Beside undo and redo
 * because it is the same kind of thing, and there so the keyboard shortcut is
 * not the only way to find it.
 */
function PasteButton({ s }: { s: Studio }) {
  const clipboard = useStudioStore((st) => st.clipboard);
  const paste = useStudioStore((st) => st.paste);
  const label = s.t('journey.studio.paste');
  return (
    <Tooltip label={clipboard ? label : s.t('journey.studio.pasteEmpty')}>
      <button
        type="button"
        className="st-tool is-icon"
        disabled={!clipboard || !s.canEdit}
        onClick={() => paste(s.activeSpread)}
        aria-label={label}
      >
        <ClipboardPaste size={15} />
      </button>
    </Tooltip>
  );
}

/**
 * Lay out again: this spread, or the whole book.
 *
 * A split button rather than two: they are the same action at two scopes, and
 * the spread is the one you want nine times out of ten. Rebuilding the whole
 * book is behind the chevron, where it cannot be hit by accident, and both are
 * ordinary undo steps.
 */
function AutoLayoutButton({ s }: { s: Studio }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useDismiss(box, open, setOpen);

  return (
    <div className="st-picker" ref={box}>
      <button
        type="button"
        className="st-tool"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={s.t('journey.studio.autoLayout')}
      >
        <Sparkles size={14} />
        <span className="st-tool-label">{s.t('journey.studio.autoLayout')}</span>
        <ChevronDown size={13} style={{ opacity: 0.5 }} />
      </button>

      {open && (
        <div className="st-menu" role="menu">
          <button
            type="button"
            className="st-menu-item"
            role="menuitem"
            disabled={!s.canRelayoutSpread}
            onClick={() => {
              s.relayoutCurrentSpread();
              setOpen(false);
            }}
          >
            <span className="st-menu-text">
              <span className="st-menu-name">{s.t('journey.studio.relayoutSpread')}</span>
              <span className="st-menu-dim">
                {s.t(s.canRelayoutSpread ? 'journey.studio.relayoutSpreadHint' : 'journey.studio.relayoutSpreadNone')}
              </span>
            </span>
          </button>
          <button
            type="button"
            className="st-menu-item"
            role="menuitem"
            onClick={() => {
              s.relayoutBook();
              setOpen(false);
            }}
          >
            <span className="st-menu-text">
              <span className="st-menu-name">{s.t('journey.studio.relayoutBook')}</span>
              <span className="st-menu-dim">{s.t('journey.studio.relayoutBookHint')}</span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * The format, as a tool of the head row: it says what the book is printed as,
 * and opening it changes that.
 *
 * A native <select> was the first draft and it was wrong: the browser draws the
 * list in its own chrome, so it ignores the theme entirely and drops a list that
 * runs off the bottom of the screen. This is a small popover instead, themed,
 * anchored under the chip, and it shows each format's proportions rather than
 * only naming them.
 */
function FormatPicker({ s }: { s: Studio }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useDismiss(box, open, setOpen);

  const active = PAGE_PRESETS[s.preset] ?? PAGE_PRESETS['square-210'];
  const width = s.preset === 'custom' ? s.page.pageWidth : active.pageWidthMm;
  const height = s.preset === 'custom' ? s.page.pageHeight : active.pageHeightMm;

  return (
    <div className="st-picker" ref={box}>
      <button
        type="button"
        className="st-tool"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={s.t('journey.studio.format')}
      >
        <span
          className="st-head-chip-shape"
          style={
            width >= height
              ? { width: 12, height: Math.max(6, Math.round((12 * height) / width)) }
              : { height: 12, width: Math.max(6, Math.round((12 * width) / height)) }
          }
        />
        <span className="st-tool-label">
          {s.preset === 'custom'
            ? `${Math.round(s.page.pageWidth)} × ${Math.round(s.page.pageHeight)} mm`
            : s.t(active.labelKey)}
        </span>
        <ChevronDown size={13} style={{ opacity: 0.5 }} />
      </button>

      {open && (
        <div className="st-menu" role="listbox">
          {PAGE_PRESET_ORDER.map((id) => {
            const p = PAGE_PRESETS[id];
            const on = id === s.preset;
            return (
              <button
                type="button"
                key={id}
                role="option"
                aria-selected={on}
                className={`st-menu-item ${on ? 'is-active' : ''}`}
                onClick={() => {
                  s.setPreset(id);
                  setOpen(false);
                }}
              >
                <span className="st-menu-tile">
                  <span
                    className="st-menu-shape"
                    style={
                      p.pageWidthMm >= p.pageHeightMm
                        ? { width: 24, height: Math.round((24 * p.pageHeightMm) / p.pageWidthMm) }
                        : { height: 24, width: Math.round((24 * p.pageWidthMm) / p.pageHeightMm) }
                    }
                  />
                </span>
                <span className="st-menu-text">
                  <span className="st-menu-name">{s.t(p.labelKey)}</span>
                  <span className="st-menu-dim">
                    {p.pageWidthMm} × {p.pageHeightMm} mm
                  </span>
                </span>
                {on && <Check size={14} />}
              </button>
            );
          })}

          {/*
            The two fields live under the list rather than behind a "custom"
            entry that opens a second popover: picking the custom row and then
            typing into the fields it reveals is two steps for one decision, and
            typing into them *is* picking custom; the hook switches the preset
            for you.
          */}
          <div className="st-menu-sep" />
          <div className="st-menu-custom">
            <TrimField
              label={s.t('journey.studio.width')}
              value={s.page.pageWidth}
              onCommit={(v) => s.setPageSize('w', v)}
            />
            <span className="st-menu-times">×</span>
            <TrimField
              label={s.t('journey.studio.height')}
              value={s.page.pageHeight}
              onCommit={(v) => s.setPageSize('h', v)}
            />
            <span className="st-menu-unit">mm</span>
          </div>

          {/*
            What the press takes off, and what it must not print into. Under the
            trim size because they answer the same question, how big is this book
            really, and because a vendor states all three in one breath.
          */}
          <div className="st-menu-custom">
            <TrimField
              label={s.t('journey.studio.bleed')}
              value={s.page.bleed}
              min={0}
              max={20}
              step={0.5}
              onCommit={(v) => s.setPageEdge('bleed', v)}
            />
            <span className="st-menu-times" />
            <TrimField
              label={s.t('journey.studio.safeArea')}
              value={s.page.safe}
              min={0}
              max={40}
              step={0.5}
              onCommit={(v) => s.setPageEdge('safe', v)}
            />
            <span className="st-menu-unit">mm</span>
          </div>
        </div>
      )}
    </div>
  );
}
