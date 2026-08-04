import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, within, fireEvent } from '../../../tests/helpers/render'
import userEvent from '@testing-library/user-event'
import { resetAllStores, seedStore } from '../../../tests/helpers/store'
import { useSettingsStore } from '../../store/settingsStore'
import { server } from '../../../tests/helpers/msw/server'
import { http, HttpResponse } from 'msw'
import BackupPanel from './BackupPanel'
import { ToastContainer } from '../shared/Toast'

const manualBackup = {
  filename: 'backup-2025-01-15.zip',
  created_at: '2025-01-15T10:00:00Z',
  size: 2048000,
}
const autoBackup = {
  filename: 'auto-backup-2025-02-01.zip',
  created_at: '2025-02-01T02:00:00Z',
  size: 1024000,
}

function defaultBackupHandlers() {
  return [
    http.get('/api/backup/list', () => HttpResponse.json({ backups: [manualBackup] })),
    http.get('/api/backup/auto-settings', () =>
      HttpResponse.json({
        settings: { enabled: false, interval: 'daily', keep_days: 7, hour: 2, day_of_week: 0, day_of_month: 1 },
        timezone: 'UTC',
      }),
    ),
  ]
}

function getToggleButton() {
  // The enable toggle is a <button> inside a <label> that contains "Enable auto-backup"
  const label = screen.getByText('Enable auto-backup').closest('label') as HTMLElement
  return label.querySelector('button') as HTMLElement
}

describe('BackupPanel', () => {
  beforeEach(() => {
    resetAllStores()
    seedStore(useSettingsStore, { settings: { time_format: '24h' } } as any)
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    server.use(...defaultBackupHandlers())
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
    server.resetHandlers()
  })

  // BKP-001: Loading state
  it('FE-ADMIN-BKP-001: shows loading spinner while fetching backups', async () => {
    server.use(
      http.get('/api/backup/list', async () => {
        await new Promise(resolve => setTimeout(resolve, 300))
        return HttpResponse.json({ backups: [] })
      }),
    )
    render(<BackupPanel />)
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  // BKP-002: Empty state
  it('FE-ADMIN-BKP-002: shows empty state when no backups exist', async () => {
    server.use(
      http.get('/api/backup/list', () => HttpResponse.json({ backups: [] })),
    )
    render(<BackupPanel />)
    await waitFor(() => {
      expect(screen.getByText('No backups yet')).toBeInTheDocument()
    })
    expect(screen.getByText('Create first backup')).toBeInTheDocument()
  })

  // BKP-003: Backup list renders filename, size, and date
  it('FE-ADMIN-BKP-003: renders filename, formatted size, and date for a backup', async () => {
    render(<BackupPanel />)
    await waitFor(() => {
      expect(screen.getByText('backup-2025-01-15.zip')).toBeInTheDocument()
    })
    expect(screen.getByText('2.0 MB')).toBeInTheDocument()
  })

  // BKP-004: Auto-backup badge shown for auto-backup filenames
  it('FE-ADMIN-BKP-004: shows Auto badge for auto-backup filenames', async () => {
    server.use(
      http.get('/api/backup/list', () => HttpResponse.json({ backups: [autoBackup] })),
    )
    render(<BackupPanel />)
    await waitFor(() => {
      expect(screen.getByText('auto-backup-2025-02-01.zip')).toBeInTheDocument()
    })
    expect(screen.getByText('Auto')).toBeInTheDocument()
  })

  // BKP-005: Create backup success
  it('FE-ADMIN-BKP-005: creates backup and shows success toast', async () => {
    const user = userEvent.setup()
    server.use(
      http.post('/api/backup/create', () => HttpResponse.json({ success: true })),
      http.get('/api/backup/list', () => HttpResponse.json({ backups: [manualBackup] })),
    )
    render(<><ToastContainer /><BackupPanel /></>)
    await waitFor(() => {
      expect(screen.getByText('backup-2025-01-15.zip')).toBeInTheDocument()
    })
    await user.click(screen.getByTitle('Create Backup'))
    await waitFor(() => {
      expect(screen.getByText('Backup created successfully')).toBeInTheDocument()
    })
  })

  // BKP-006: Restore opens confirmation modal
  it('FE-ADMIN-BKP-006: clicking Restore opens confirmation modal', async () => {
    const user = userEvent.setup()
    render(<BackupPanel />)
    await waitFor(() => {
      expect(screen.getByText('backup-2025-01-15.zip')).toBeInTheDocument()
    })
    await user.click(screen.getAllByText('Restore')[0])
    await waitFor(() => {
      expect(screen.getByText('Restore Backup?')).toBeInTheDocument()
    })
    expect(screen.getAllByText('backup-2025-01-15.zip').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Yes, restore')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })

  // BKP-007: Cancel dismisses modal without calling restore API
  it('FE-ADMIN-BKP-007: cancel dismisses the restore modal without calling the API', async () => {
    const user = userEvent.setup()
    let restoreCalled = false
    server.use(
      http.post('/api/backup/restore/:filename', () => {
        restoreCalled = true
        return HttpResponse.json({ success: true })
      }),
    )
    render(<BackupPanel />)
    await waitFor(() => {
      expect(screen.getByText('backup-2025-01-15.zip')).toBeInTheDocument()
    })
    await user.click(screen.getAllByText('Restore')[0])
    await waitFor(() => {
      expect(screen.getByText('Restore Backup?')).toBeInTheDocument()
    })
    await user.click(screen.getByText('Cancel'))
    await waitFor(() => {
      expect(screen.queryByText('Restore Backup?')).not.toBeInTheDocument()
    })
    expect(restoreCalled).toBe(false)
  })

  // BKP-008: Backdrop click dismisses modal
  it('FE-ADMIN-BKP-008: clicking the backdrop dismisses the restore modal', async () => {
    const user = userEvent.setup()
    render(<BackupPanel />)
    await waitFor(() => {
      expect(screen.getByText('backup-2025-01-15.zip')).toBeInTheDocument()
    })
    await user.click(screen.getAllByText('Restore')[0])
    await waitFor(() => {
      expect(screen.getByText('Restore Backup?')).toBeInTheDocument()
    })
    // Click the backdrop overlay (the fixed-position div)
    const backdrop = document.querySelector('[style*="position: fixed"]') as HTMLElement
    expect(backdrop).toBeTruthy()
    fireEvent.click(backdrop!)
    await waitFor(() => {
      expect(screen.queryByText('Restore Backup?')).not.toBeInTheDocument()
    })
  })

  // BKP-009: Successful restore calls API and reloads after 1500ms
  it('FE-ADMIN-BKP-009: successful restore shows toast and reloads after 1500ms', async () => {
    const user = userEvent.setup()
    server.use(
      http.post('/api/backup/restore/:filename', () => HttpResponse.json({ success: true })),
    )
    render(<><ToastContainer /><BackupPanel /></>)
    await waitFor(() => {
      expect(screen.getByText('backup-2025-01-15.zip')).toBeInTheDocument()
    })

    // Stub reload AFTER initial data load so we don't corrupt window.location during setup
    const reloadMock = vi.fn()
    vi.stubGlobal('location', { ...window.location, reload: reloadMock })

    await user.click(screen.getAllByText('Restore')[0])
    await waitFor(() => expect(screen.getByText('Restore Backup?')).toBeInTheDocument())
    await user.click(screen.getByText('Yes, restore'))
    await waitFor(() => expect(screen.getByText('Backup restored. Page will reload…')).toBeInTheDocument())

    // Wait for the 1500ms reload timer to fire
    await new Promise(resolve => setTimeout(resolve, 1600))
    expect(reloadMock).toHaveBeenCalled()
    vi.unstubAllGlobals()
  }, 20000)

  // BKP-010: Delete backup with confirm dialog
  it('FE-ADMIN-BKP-010: deletes backup after confirm and shows success toast', async () => {
    const user = userEvent.setup()
    server.use(
      http.delete('/api/backup/:filename', () => HttpResponse.json({ success: true })),
    )
    render(<><ToastContainer /><BackupPanel /></>)
    await waitFor(() => {
      expect(screen.getByText('backup-2025-01-15.zip')).toBeInTheDocument()
    })
    const trashBtn = Array.from(document.querySelectorAll('button')).find(
      b => b.querySelector('svg.lucide-trash2'),
    ) as HTMLElement
    expect(trashBtn).toBeTruthy()
    await user.click(trashBtn!)
    await waitFor(() => {
      expect(screen.getByText('Backup deleted')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.queryByText('backup-2025-01-15.zip')).not.toBeInTheDocument()
    })
  })

  // BKP-011: Auto-backup enable toggle shows interval controls
  it('FE-ADMIN-BKP-011: enabling auto-backup shows interval controls', async () => {
    const user = userEvent.setup()
    render(<BackupPanel />)
    await waitFor(() => {
      expect(screen.getByText('Enable auto-backup')).toBeInTheDocument()
    })
    expect(screen.queryByText('Hourly')).not.toBeInTheDocument()
    await user.click(getToggleButton())
    await waitFor(() => {
      expect(screen.getByText('Hourly')).toBeInTheDocument()
      expect(screen.getByText('Daily')).toBeInTheDocument()
      expect(screen.getByText('Weekly')).toBeInTheDocument()
      expect(screen.getByText('Monthly')).toBeInTheDocument()
    })
  })

  // BKP-012: Weekly interval shows day-of-week picker
  it('FE-ADMIN-BKP-012: weekly interval shows day-of-week picker', async () => {
    const user = userEvent.setup()
    server.use(
      http.get('/api/backup/auto-settings', () =>
        HttpResponse.json({
          settings: { enabled: true, interval: 'daily', keep_days: 7, hour: 2, day_of_week: 0, day_of_month: 1 },
          timezone: 'UTC',
        }),
      ),
    )
    render(<BackupPanel />)
    await waitFor(() => {
      expect(screen.getByText('Weekly')).toBeInTheDocument()
    })
    expect(screen.queryByText('Sun')).not.toBeInTheDocument()
    await user.click(screen.getByText('Weekly'))
    await waitFor(() => {
      expect(screen.getByText('Sun')).toBeInTheDocument()
      expect(screen.getByText('Mon')).toBeInTheDocument()
      expect(screen.getByText('Sat')).toBeInTheDocument()
    })
    expect(screen.queryByText('Day of month')).not.toBeInTheDocument()
  })

  // BKP-013: Save auto-settings calls API and shows toast
  it('FE-ADMIN-BKP-013: saving auto-settings calls API and shows success toast', async () => {
    const user = userEvent.setup()
    server.use(
      http.get('/api/backup/auto-settings', () =>
        HttpResponse.json({
          settings: { enabled: true, interval: 'daily', keep_days: 7, hour: 2, day_of_week: 0, day_of_month: 1 },
          timezone: 'UTC',
        }),
      ),
      http.put('/api/backup/auto-settings', () =>
        HttpResponse.json({
          settings: { enabled: true, interval: 'weekly', keep_days: 7, hour: 2, day_of_week: 0, day_of_month: 1 },
        }),
      ),
    )
    render(<><ToastContainer /><BackupPanel /></>)
    await waitFor(() => {
      expect(screen.getByText('Weekly')).toBeInTheDocument()
    })
    await user.click(screen.getByText('Weekly'))
    await waitFor(() => {
      const saveBtn = screen.getByRole('button', { name: /^save$/i })
      expect(saveBtn).not.toBeDisabled()
    })
    await user.click(screen.getByRole('button', { name: /^save$/i }))
    await waitFor(() => {
      expect(screen.getByText('Auto-backup settings saved')).toBeInTheDocument()
    })
  })

  // BKP-014: Save button disabled until settings changed
  it('FE-ADMIN-BKP-014: save button is disabled until settings are changed', async () => {
    const user = userEvent.setup()
    render(<BackupPanel />)
    await waitFor(() => {
      expect(screen.getByText('Enable auto-backup')).toBeInTheDocument()
    })
    const saveBtn = screen.getByRole('button', { name: /^save$/i })
    expect(saveBtn).toBeDisabled()
    await user.click(getToggleButton())
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^save$/i })).not.toBeDisabled()
    })
  })

  // BKP-015: List request fails
  it('FE-ADMIN-BKP-015: a failing list request toasts and keeps the empty state', async () => {
    server.use(http.get('/api/backup/list', () => HttpResponse.error()))
    render(<><ToastContainer /><BackupPanel /></>)

    expect(await screen.findByText('Failed to load backups')).toBeInTheDocument()
    expect(screen.getByText('No backups yet')).toBeInTheDocument()
  })

  // BKP-016: Create fails
  it('FE-ADMIN-BKP-016: a failing create toasts the error and re-enables the button', async () => {
    const user = userEvent.setup()
    server.use(http.post('/api/backup/create', () => HttpResponse.error()))
    render(<><ToastContainer /><BackupPanel /></>)
    await screen.findByText('backup-2025-01-15.zip')

    await user.click(screen.getByTitle('Create Backup'))

    expect(await screen.findByText('Failed to create backup')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByTitle('Create Backup')).toBeEnabled())
  })

  // BKP-017: Restore fails
  it('FE-ADMIN-BKP-017: a failing restore surfaces the server message and clears the spinner', async () => {
    const user = userEvent.setup()
    server.use(
      http.post('/api/backup/restore/:filename', () =>
        HttpResponse.json({ error: 'archive is corrupt' }, { status: 400 }),
      ),
    )
    render(<><ToastContainer /><BackupPanel /></>)
    await screen.findByText('backup-2025-01-15.zip')

    await user.click(screen.getAllByText('Restore')[0])
    await user.click(await screen.findByText('Yes, restore'))

    expect(await screen.findByText('archive is corrupt')).toBeInTheDocument()
    await waitFor(() => expect(screen.getAllByText('Restore')[0].closest('button')).toBeEnabled())
  })

  // BKP-018: Upload & restore happy path
  it('FE-ADMIN-BKP-018: picking a file opens the modal and uploads it on confirm', async () => {
    const user = userEvent.setup()
    let uploaded = false
    server.use(
      http.post('/api/backup/upload-restore', () => {
        uploaded = true
        return HttpResponse.json({ success: true })
      }),
    )
    render(<><ToastContainer /><BackupPanel /></>)
    await screen.findByText('backup-2025-01-15.zip')

    const reloadMock = vi.fn()
    vi.stubGlobal('location', { ...window.location, reload: reloadMock })

    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, new File(['zip'], 'restore-me.zip', { type: 'application/zip' }))

    expect(await screen.findByText('Restore Backup?')).toBeInTheDocument()
    expect(screen.getByText('restore-me.zip')).toBeInTheDocument()
    // The picked file is cleared from the input so the same file can be chosen again
    expect(input.value).toBe('')

    await user.click(screen.getByText('Yes, restore'))
    await waitFor(() => expect(uploaded).toBe(true))
    expect(await screen.findByText('Backup restored. Page will reload…')).toBeInTheDocument()
    vi.unstubAllGlobals()
  })

  // BKP-019: Upload & restore failure
  it('FE-ADMIN-BKP-019: a failing upload restore toasts and re-enables the upload button', async () => {
    const user = userEvent.setup()
    server.use(
      http.post('/api/backup/upload-restore', () => HttpResponse.json({ error: 'not a backup' }, { status: 400 })),
    )
    render(<><ToastContainer /><BackupPanel /></>)
    await screen.findByText('backup-2025-01-15.zip')

    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, new File(['zip'], 'broken.zip', { type: 'application/zip' }))
    await user.click(await screen.findByText('Yes, restore'))

    expect(await screen.findByText('not a backup')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByTitle('Upload Backup')).toBeEnabled())
  })

  // BKP-020: Upload button forwards the click to the hidden file input
  it('FE-ADMIN-BKP-020: the Upload button opens the hidden file picker', async () => {
    const user = userEvent.setup()
    render(<BackupPanel />)
    await screen.findByText('backup-2025-01-15.zip')

    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const clickSpy = vi.spyOn(input, 'click').mockImplementation(() => {})
    await user.click(screen.getByTitle('Upload Backup'))

    expect(clickSpy).toHaveBeenCalled()
  })

  // BKP-021: Delete declined / failing
  it('FE-ADMIN-BKP-021: declining the confirm keeps the backup, a failing delete toasts', async () => {
    const user = userEvent.setup()
    let deleteCalls = 0
    server.use(
      http.delete('/api/backup/:filename', () => {
        deleteCalls += 1
        return HttpResponse.json({ error: 'file is locked' }, { status: 500 })
      }),
    )
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(<><ToastContainer /><BackupPanel /></>)
    await screen.findByText('backup-2025-01-15.zip')

    const trashBtn = Array.from(document.querySelectorAll('button')).find(
      b => b.querySelector('svg.lucide-trash2'),
    ) as HTMLElement
    await user.click(trashBtn)
    expect(deleteCalls).toBe(0)
    expect(screen.getByText('backup-2025-01-15.zip')).toBeInTheDocument()

    confirmSpy.mockReturnValue(true)
    await user.click(trashBtn)

    expect(await screen.findByText('Failed to delete')).toBeInTheDocument()
    expect(screen.getByText('backup-2025-01-15.zip')).toBeInTheDocument()
  })

  // BKP-022: Auto settings save fails
  it('FE-ADMIN-BKP-022: a failing auto-settings save toasts and keeps the form dirty', async () => {
    const user = userEvent.setup()
    server.use(http.put('/api/backup/auto-settings', () => HttpResponse.error()))
    render(<><ToastContainer /><BackupPanel /></>)
    await screen.findByText('Enable auto-backup')

    await user.click(getToggleButton())
    await user.click(screen.getByRole('button', { name: /^save$/i }))

    expect(await screen.findByText('Failed to save settings')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('button', { name: /^save$/i })).toBeEnabled())
  })

  // BKP-023: Size/date fallbacks
  it('FE-ADMIN-BKP-023: missing size and date render as a dash, kilobytes are formatted', async () => {
    server.use(
      http.get('/api/backup/list', () =>
        HttpResponse.json({
          backups: [
            { filename: 'empty.zip', created_at: null, size: 0 },
            { filename: 'small.zip', created_at: '2025-03-01T08:00:00Z', size: 5120 },
          ],
        }),
      ),
    )
    render(<BackupPanel />)
    await screen.findByText('empty.zip')

    expect(screen.getAllByText('-')).toHaveLength(2)
    expect(screen.getByText('5.0 KB')).toBeInTheDocument()
  })

  // BKP-024: Invalid server timezone
  it('FE-ADMIN-BKP-024: an unusable server timezone falls back to the raw timestamp', async () => {
    server.use(
      http.get('/api/backup/auto-settings', () =>
        HttpResponse.json({
          settings: { enabled: false, interval: 'daily', keep_days: 7, hour: 2, day_of_week: 0, day_of_month: 1 },
          timezone: 'Not/AZone',
        }),
      ),
    )
    render(<BackupPanel />)
    await screen.findByText('backup-2025-01-15.zip')

    await waitFor(() => expect(screen.getByText('2025-01-15T10:00:00Z')).toBeInTheDocument())
  })

  // BKP-025: 12h hour picker
  it('FE-ADMIN-BKP-025: the hour picker uses AM/PM labels for 12h users and stores the pick', async () => {
    const user = userEvent.setup()
    seedStore(useSettingsStore, { settings: { time_format: '12h' } } as any)
    let saved: Record<string, unknown> | null = null
    server.use(
      http.get('/api/backup/auto-settings', () =>
        HttpResponse.json({
          settings: { enabled: true, interval: 'daily', keep_days: 7, hour: 0, day_of_week: 0, day_of_month: 1 },
          timezone: 'UTC',
        }),
      ),
      http.put('/api/backup/auto-settings', async ({ request }) => {
        saved = await request.json() as Record<string, unknown>
        return HttpResponse.json({ settings: saved })
      }),
    )
    render(<><ToastContainer /><BackupPanel /></>)
    await screen.findByText('Run at hour')

    expect(screen.getByText('Server local time (12h format) (Timezone: UTC)')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '12:00 AM' }))
    await user.click(await screen.findByRole('button', { name: '2:00 PM' }))
    await user.click(screen.getByRole('button', { name: /^save$/i }))

    await waitFor(() => expect(saved).toMatchObject({ hour: 14 }))
  })

  // BKP-026: Monthly interval
  it('FE-ADMIN-BKP-026: the monthly interval offers a day-of-month picker', async () => {
    const user = userEvent.setup()
    let saved: Record<string, unknown> | null = null
    server.use(
      http.get('/api/backup/auto-settings', () =>
        HttpResponse.json({
          settings: { enabled: true, interval: 'monthly', keep_days: 7, hour: 2, day_of_week: 0, day_of_month: 1 },
          timezone: '',
        }),
      ),
      http.put('/api/backup/auto-settings', async ({ request }) => {
        saved = await request.json() as Record<string, unknown>
        return HttpResponse.json({ settings: saved })
      }),
    )
    render(<><ToastContainer /><BackupPanel /></>)
    await screen.findByText('Day of month')

    // No timezone from the server → the hint carries no timezone suffix
    expect(screen.getByText('Server local time (24h format)')).toBeInTheDocument()
    expect(screen.queryByText('Sun')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '1' }))
    await user.click(await screen.findByRole('button', { name: '15' }))
    await user.click(screen.getByRole('button', { name: /^save$/i }))

    await waitFor(() => expect(saved).toMatchObject({ day_of_month: 15 }))
  })

  // BKP-027: Day of week + retention
  it('FE-ADMIN-BKP-027: day-of-week and retention picks are stored together', async () => {
    const user = userEvent.setup()
    let saved: Record<string, unknown> | null = null
    server.use(
      http.get('/api/backup/auto-settings', () =>
        HttpResponse.json({
          settings: { enabled: true, interval: 'weekly', keep_days: 7, hour: 2, day_of_week: 0, day_of_month: 1 },
          timezone: 'UTC',
        }),
      ),
      http.put('/api/backup/auto-settings', async ({ request }) => {
        saved = await request.json() as Record<string, unknown>
        return HttpResponse.json({ settings: saved })
      }),
    )
    render(<><ToastContainer /><BackupPanel /></>)
    await screen.findByText('Day of week')

    await user.click(screen.getByText('Fri'))
    await user.click(screen.getByText('Keep forever'))
    await user.click(screen.getByRole('button', { name: /^save$/i }))

    await waitFor(() => expect(saved).toMatchObject({ day_of_week: 5, keep_days: 0 }))
  })

  // BKP-028: Download failure
  it('FE-ADMIN-BKP-028: a failing download toasts the download error', async () => {
    const user = userEvent.setup()
    server.use(http.get('/api/backup/download/:filename', () => HttpResponse.error()))
    render(<><ToastContainer /><BackupPanel /></>)
    await screen.findByText('backup-2025-01-15.zip')

    await user.click(screen.getByText('Download'))

    expect(await screen.findByText('Download failed')).toBeInTheDocument()
  })

  // BKP-029: Confirm button hover styling
  it('FE-ADMIN-BKP-029: the destructive confirm button darkens on hover', async () => {
    const user = userEvent.setup()
    render(<BackupPanel />)
    await screen.findByText('backup-2025-01-15.zip')

    await user.click(screen.getAllByText('Restore')[0])
    const confirmBtn = await screen.findByText('Yes, restore')

    fireEvent.mouseEnter(confirmBtn)
    expect(confirmBtn.style.background).toBe('rgb(185, 28, 28)')
    fireEvent.mouseLeave(confirmBtn)
    expect(confirmBtn.style.background).toBe('rgb(220, 38, 38)')
  })
})
