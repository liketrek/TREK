// FE-RN-001 to FE-RN-014
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../../../tests/helpers/render'
import userEvent from '@testing-library/user-event'
import { ReleaseNoticeModal } from './ReleaseNoticeModal'
import type { SystemNoticeDTO } from '../../store/systemNoticeStore'

/** A notice shaped like the release-notes registry entry, with the pieces a test needs to vary. */
function releaseNotice(overrides: Partial<SystemNoticeDTO> = {}): SystemNoticeDTO {
  return {
    id: 'release-notes',
    display: 'modal',
    severity: 'info',
    titleKey: 'rel.headline',
    bodyKey: 'rel.intro',
    dismissible: true,
    desktopOnly: true,
    cta: { kind: 'link', labelKey: 'rel.bmc', href: 'https://buymeacoffee.com/mauriceboe' },
    secondaryCta: { kind: 'link', labelKey: 'rel.kofi', href: 'https://ko-fi.com/mauriceboe' },
    release: {
      version: '4.3.0',
      eyebrowKey: 'rel.eyebrow',
      headlineKey: 'rel.headline',
      introKey: 'rel.intro',
      featuresLabelKey: 'rel.features.label',
      features: [
        { iconName: 'Database', visual: 'places-api', titleKey: 'rel.f1.title', bodyKey: 'rel.f1.body' },
        { iconName: 'Route', visual: 'roadtrip', titleKey: 'rel.f2.title', bodyKey: 'rel.f2.body' },
        { iconName: 'MapPin', visual: 'dawarich', titleKey: 'rel.f3.title', bodyKey: 'rel.f3.body' },
      ],
      note: {
        eyebrowKey: 'rel.note.eyebrow',
        titleKey: 'rel.note.title',
        bodyKey: 'rel.note.body',
        promiseLabelKey: 'rel.promise.label',
        promiseLeadKey: 'rel.promise.lead',
        promiseTextKey: 'rel.promise.text',
        bodyAfterKey: 'rel.note.after',
        closingKey: 'rel.note.closing',
      },
      supportLeadKey: 'rel.support.lead',
      supportTextKey: 'rel.support',
    },
    ...overrides,
  } as SystemNoticeDTO
}

function renderModal(notice = releaseNotice(), handlers: Partial<{
  onDismiss: () => void; onCTA: () => void; onSecondaryCTA: () => void
}> = {}) {
  const onDismiss = handlers.onDismiss ?? vi.fn()
  const onCTA = handlers.onCTA ?? vi.fn()
  const onSecondaryCTA = handlers.onSecondaryCTA ?? vi.fn()
  const view = render(
    <ReleaseNoticeModal
      notice={notice}
      visible
      onDismiss={onDismiss}
      onCTA={onCTA}
      onSecondaryCTA={onSecondaryCTA}
    />
  )
  return { ...view, onDismiss, onCTA, onSecondaryCTA }
}

describe('ReleaseNoticeModal', () => {
  it('FE-RN-001: renders nothing for a notice without a release block', () => {
    const { container } = renderModal(releaseNotice({ release: undefined }))
    expect(container.querySelector('.rn-overlay')).toBeNull()
  })

  it('FE-RN-002: shows the version as a plain figure, not a translation key', () => {
    renderModal()
    expect(screen.getByText('4.3.0')).toBeInTheDocument()
  })

  it('FE-RN-003: renders one card per feature, each with its drawing', () => {
    renderModal()
    expect(screen.getByText('rel.f1.title')).toBeInTheDocument()
    expect(document.querySelectorAll('.rn-feature')).toHaveLength(3)
    expect(document.querySelector('.rn-vis-places')).not.toBeNull()
    expect(document.querySelector('.rn-vis-road')).not.toBeNull()
    expect(document.querySelector('.rn-vis-trail')).not.toBeNull()
  })

  it('FE-RN-004: splits the note body on the blank line into separate paragraphs', () => {
    const n = releaseNotice()
    // The translation stub echoes the key, so drive the split through a real value.
    n.release!.note.bodyKey = 'first paragraph\n\nsecond paragraph'
    renderModal(n)
    expect(screen.getByText('first paragraph')).toBeInTheDocument()
    expect(screen.getByText('second paragraph')).toBeInTheDocument()
  })

  it('FE-RN-005: omits the foot when the release has neither a footnote nor notes', () => {
    renderModal()
    expect(document.querySelector('.rn-release-foot')).toBeNull()
  })

  it('FE-RN-006: shows the footnote and the notes link when both are present', () => {
    const n = releaseNotice()
    n.release!.footnoteKey = 'rel.footnote'
    n.release!.notes = { labelKey: 'rel.notes', href: 'https://example.test/notes' }
    renderModal(n)
    expect(screen.getByText('rel.footnote')).toBeInTheDocument()
    const link = screen.getByRole('link', { name: /rel\.notes/ })
    expect(link).toHaveAttribute('href', 'https://example.test/notes')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('FE-RN-007: dismisses from the close button and from the backdrop', async () => {
    const user = userEvent.setup()
    const onDismiss = vi.fn()
    renderModal(releaseNotice(), { onDismiss })

    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(onDismiss).toHaveBeenCalledTimes(1)

    await user.click(document.querySelector('.rn-overlay')!)
    expect(onDismiss).toHaveBeenCalledTimes(2)
  })

  it('FE-RN-008: a click inside the panel does not dismiss', async () => {
    const user = userEvent.setup()
    const onDismiss = vi.fn()
    renderModal(releaseNotice(), { onDismiss })
    await user.click(screen.getByText('rel.note.title'))
    expect(onDismiss).not.toHaveBeenCalled()
  })

  it('FE-RN-009: a non-dismissible notice has no close button and an inert backdrop', async () => {
    const user = userEvent.setup()
    const onDismiss = vi.fn()
    renderModal(releaseNotice({ dismissible: false }), { onDismiss })
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull()
    await user.click(document.querySelector('.rn-overlay')!)
    expect(onDismiss).not.toHaveBeenCalled()
  })

  it('FE-RN-010: wires each support button to its own handler', async () => {
    const user = userEvent.setup()
    const onCTA = vi.fn()
    const onSecondaryCTA = vi.fn()
    renderModal(releaseNotice(), { onCTA, onSecondaryCTA })

    await user.click(screen.getByRole('button', { name: /rel\.bmc/ }))
    expect(onCTA).toHaveBeenCalledTimes(1)
    expect(onSecondaryCTA).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: /rel\.kofi/ }))
    expect(onSecondaryCTA).toHaveBeenCalledTimes(1)
  })

  it('FE-RN-011: labels the dialog with the headline and describes it with the intro', () => {
    renderModal()
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-labelledby', 'notice-title-release-notes')
    expect(dialog).toHaveAttribute('aria-describedby', 'notice-body-release-notes')
    expect(document.getElementById('notice-title-release-notes')).toHaveTextContent('rel.headline')
    expect(document.getElementById('notice-body-release-notes')).toHaveTextContent('rel.intro')
  })

  it('FE-RN-012: sets the promise and the support text with a bold lead', () => {
    renderModal()
    expect(screen.getByText('rel.promise.lead').tagName).toBe('B')
    expect(screen.getByText('rel.support.lead').tagName).toBe('B')
    expect(screen.getByText('rel.promise.text')).toBeInTheDocument()
  })

  it('FE-RN-013: the features aside is optional', () => {
    renderModal()
    expect(document.querySelector('.rn-features-aside')).toBeNull()

    const n = releaseNotice()
    n.release!.featuresAsideKey = 'rel.features.aside'
    renderModal(n)
    expect(screen.getByText('rel.features.aside')).toBeInTheDocument()
  })

  it('FE-RN-014: a card whose drawing this client does not know falls back to its icon', () => {
    const n = releaseNotice()
    n.release!.features = [
      { iconName: 'Route', visual: 'from-a-newer-server', titleKey: 'rel.x.title', bodyKey: 'rel.x.body' },
      { iconName: 'NoSuchIcon', titleKey: 'rel.y.title', bodyKey: 'rel.y.body' },
    ]
    renderModal(n)
    expect(document.querySelectorAll('.rn-vis-icon')).toHaveLength(2)
    expect(document.querySelectorAll('.rn-vis-icon svg')).toHaveLength(2)
  })
})
