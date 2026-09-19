// FE-DOCSYNC-FLOW-001 to FE-DOCSYNC-FLOW-013

/**
 * The direction control of the document-sync dialog.
 *
 * Two lanes, each one a direction that is either carrying or idle. The rules
 * that matter to somebody using it: what each side is holding is readable
 * before a word is, switching direction means switching a lane off, and the
 * last lane cannot be switched off, a binding with no direction syncs
 * nothing, and a dialog that lets you build one has lied about what it does.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import en from '@trek/shared/i18n/en'
import { render, screen, fireEvent } from '../../../../tests/helpers/render'
import DocSyncFlow, { type FlowHoldings, type SyncDirection } from './DocSyncFlow'

// The captions come from the locale rather than from English typed out here:
// the assertion is "the lane labelled as the outbound one", not the wording.
const S = en as unknown as Record<string, string>
const OUT = S['docsync.flow.toProvider']
const IN = S['docsync.flow.toTrek']

const onChange = vi.fn()

const holdings: FlowHoldings = { inTrek: 12, atProvider: 7, paired: 5, missing: 2 }

function renderFlow(
  props: Partial<{
    direction: SyncDirection
    providerId: string
    providerName: string
    holdings: FlowHoldings
    running: boolean
    disabled: boolean
  }> = {},
) {
  return render(
    <DocSyncFlow
      direction="both"
      providerId="paperless"
      providerName="Paperless"
      holdings={holdings}
      onChange={onChange}
      {...props}
    />,
  )
}

const laneOut = () => screen.getByRole('button', { name: OUT })
const laneIn = () => screen.getByRole('button', { name: IN })

beforeEach(() => {
  vi.clearAllMocks()
})

describe('DocSyncFlow ends', () => {
  it('FE-DOCSYNC-FLOW-001: shows what each side is holding, next to the name of that side', () => {
    renderFlow()

    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
    expect(screen.getByText(S['docsync.flow.trek'])).toBeInTheDocument()
    expect(screen.getByText('Paperless')).toBeInTheDocument()
  })

  it('FE-DOCSYNC-FLOW-002: an empty side reads as zero rather than as nothing', () => {
    // A healthy binding transfers nothing; the panel must still answer the
    // question somebody opened it for.
    renderFlow({ holdings: { inTrek: 0, atProvider: 0, paired: 0, missing: 0 } })

    expect(screen.getAllByText('0')).toHaveLength(2)
  })

  it('FE-DOCSYNC-FLOW-003: an unrecognised store still names itself', () => {
    renderFlow({ providerId: 'not-a-provider', providerName: 'Some Store' })

    expect(screen.getByText('Some Store')).toBeInTheDocument()
    expect(laneOut()).toBeInTheDocument()
  })
})

describe('DocSyncFlow direction switching', () => {
  it('FE-DOCSYNC-FLOW-004: switching the outbound lane off from both leaves inbound only', () => {
    renderFlow({ direction: 'both' })

    fireEvent.click(laneOut())

    expect(onChange).toHaveBeenCalledWith('pull')
  })

  it('FE-DOCSYNC-FLOW-005: switching the inbound lane off from both leaves outbound only', () => {
    renderFlow({ direction: 'both' })

    fireEvent.click(laneIn())

    expect(onChange).toHaveBeenCalledWith('push')
  })

  it('FE-DOCSYNC-FLOW-006: switching the idle inbound lane on from push gives both ways', () => {
    renderFlow({ direction: 'push' })

    fireEvent.click(laneIn())

    expect(onChange).toHaveBeenCalledWith('both')
  })

  it('FE-DOCSYNC-FLOW-007: switching the idle outbound lane on from pull gives both ways', () => {
    renderFlow({ direction: 'pull' })

    fireEvent.click(laneOut())

    expect(onChange).toHaveBeenCalledWith('both')
  })

  it('FE-DOCSYNC-FLOW-008: the last carrying lane refuses to switch off (push)', () => {
    renderFlow({ direction: 'push' })

    fireEvent.click(laneOut())

    expect(onChange).not.toHaveBeenCalled()
    expect(laneOut()).toHaveAttribute('aria-pressed', 'true')
  })

  it('FE-DOCSYNC-FLOW-009: the last carrying lane refuses to switch off (pull)', () => {
    renderFlow({ direction: 'pull' })

    fireEvent.click(laneIn())

    expect(onChange).not.toHaveBeenCalled()
    expect(laneIn()).toHaveAttribute('aria-pressed', 'true')
  })

  it('FE-DOCSYNC-FLOW-010: a member who may not edit the binding cannot move the lanes', () => {
    renderFlow({ direction: 'both', disabled: true })

    expect(laneOut()).toBeDisabled()
    expect(laneIn()).toBeDisabled()

    fireEvent.click(laneOut())
    fireEvent.click(laneIn())

    expect(onChange).not.toHaveBeenCalled()
  })
})

describe('DocSyncFlow lane state', () => {
  it('FE-DOCSYNC-FLOW-011: aria-pressed mirrors each lane in every direction', () => {
    const { rerender } = renderFlow({ direction: 'both' })
    expect(laneOut()).toHaveAttribute('aria-pressed', 'true')
    expect(laneIn()).toHaveAttribute('aria-pressed', 'true')

    rerender(
      <DocSyncFlow
        direction="push"
        providerId="paperless"
        providerName="Paperless"
        holdings={holdings}
        onChange={onChange}
      />,
    )
    expect(laneOut()).toHaveAttribute('aria-pressed', 'true')
    expect(laneIn()).toHaveAttribute('aria-pressed', 'false')

    rerender(
      <DocSyncFlow
        direction="pull"
        providerId="paperless"
        providerName="Paperless"
        holdings={holdings}
        onChange={onChange}
      />,
    )
    expect(laneOut()).toHaveAttribute('aria-pressed', 'false')
    expect(laneIn()).toHaveAttribute('aria-pressed', 'true')
  })

  it('FE-DOCSYNC-FLOW-012: only the switched-off lane is hatched', () => {
    // The hatch is the whole of "this road is not driven on", there is no
    // other handle for it, so the class is the behaviour here.
    const { rerender } = renderFlow({ direction: 'both' })
    expect(laneOut()).not.toHaveClass('trek-docsync-lane-off')
    expect(laneIn()).not.toHaveClass('trek-docsync-lane-off')

    rerender(
      <DocSyncFlow
        direction="push"
        providerId="paperless"
        providerName="Paperless"
        holdings={holdings}
        onChange={onChange}
      />,
    )
    expect(laneOut()).not.toHaveClass('trek-docsync-lane-off')
    expect(laneIn()).toHaveClass('trek-docsync-lane-off')
  })

  it('FE-DOCSYNC-FLOW-013: the hint tells an editor the lanes are tappable, a reader only what happens', () => {
    const { rerender } = renderFlow({ direction: 'both' })
    expect(screen.getByText(S['docsync.flow.summaryEditable.both'])).toBeInTheDocument()

    rerender(
      <DocSyncFlow
        direction="both"
        providerId="paperless"
        providerName="Paperless"
        holdings={holdings}
        disabled
        onChange={onChange}
      />,
    )
    expect(screen.getByText(S['docsync.flow.summary.both'])).toBeInTheDocument()
    expect(screen.queryByText(S['docsync.flow.summaryEditable.both'])).not.toBeInTheDocument()
  })
})
