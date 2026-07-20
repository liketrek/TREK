import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, within, fireEvent } from '../../../tests/helpers/render'
import userEvent from '@testing-library/user-event'
import { resetAllStores, seedStore } from '../../../tests/helpers/store'
import { useSettingsStore } from '../../store/settingsStore'
import { server } from '../../../tests/helpers/msw/server'
import { http, HttpResponse } from 'msw'
import BackupPanel from './BackupPanel'
import { ToastContainer } from '../shared/Toast'

// The list is merged across disk and the external target, so entries carry
// where they live. No target configured in most tests: local only.
const manualBackup = {
  filename: 'backup-2025-01-15.zip',
  created_at: '2025-01-15T10:00:00Z',
  size: 2048000,
  local: true,
  remote: false,
}
const autoBackup = {
  filename: 'auto-backup-2025-02-01.zip',
  created_at: '2025-02-01T02:00:00Z',
  size: 1024000,
  local: true,
  remote: false,
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
    // Deleting now refetches instead of filtering local state, so the row only
    // disappears if the server stops listing it — which is the real contract
    // now that an archive can also exist at the external target.
    let deleted = false
    server.use(
      http.delete('/api/backup/:filename', () => {
        deleted = true
        return HttpResponse.json({ success: true })
      }),
      http.get('/api/backup/list', () => HttpResponse.json({ backups: deleted ? [] : [manualBackup] })),
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

  describe('external S3 backup target', () => {
    const storedTarget = {
      enabled: true,
      endpoint: 'https://s3.example.test',
      region: 'us-east-1',
      bucket: 'trek-backups',
      prefix: 'nightly/',
      access_key_id: 'AKIA',
      secret_access_key_set: true,
      force_path_style: false,
      require_tls: true,
      managed_by_env: false,
    }

    // BKP-015: the stored secret is never delivered to the browser
    it('FE-ADMIN-BKP-015: shows the secret masked and re-submits the mask untouched', async () => {
      const user = userEvent.setup()
      let sent: Record<string, unknown> | null = null
      server.use(
        http.get('/api/backup/target', () => HttpResponse.json(storedTarget)),
        http.put('/api/backup/target', async ({ request }) => {
          sent = (await request.json()) as Record<string, unknown>
          return HttpResponse.json(storedTarget)
        }),
      )
      render(<><ToastContainer /><BackupPanel /></>)

      await waitFor(() => expect(screen.getByText('External backup target')).toBeInTheDocument())
      const secret = screen.getByLabelText('Secret access key') as HTMLInputElement
      expect(secret.value).toBe('••••••••')
      expect(secret.type).toBe('password')

      // Change something else and save — the mask must go back untouched so the
      // server keeps the stored secret instead of overwriting it with dots.
      await user.clear(screen.getByLabelText('Bucket'))
      await user.type(screen.getByLabelText('Bucket'), 'other-bucket')
      await user.click(screen.getByRole('button', { name: /save target/i }))

      await waitFor(() => expect(sent).not.toBeNull())
      expect(sent!.secret_access_key).toBe('••••••••')
      expect(sent!.bucket).toBe('other-bucket')
    })

    // BKP-016: env-configured targets are read-only, and say so
    it('FE-ADMIN-BKP-016: locks the form when the target comes from environment variables', async () => {
      server.use(
        http.get('/api/backup/target', () => HttpResponse.json({ ...storedTarget, managed_by_env: true })),
      )
      render(<><ToastContainer /><BackupPanel /></>)

      await waitFor(() => expect(screen.getByText(/configured through BACKUP_S3_/i)).toBeInTheDocument())
      expect(screen.getByLabelText('Bucket')).toBeDisabled()
    })

    // BKP-017: turning TLS off must not be quiet about it
    it('FE-ADMIN-BKP-017: warns when HTTPS is disabled', async () => {
      const user = userEvent.setup()
      server.use(http.get('/api/backup/target', () => HttpResponse.json(storedTarget)))
      render(<><ToastContainer /><BackupPanel /></>)

      await waitFor(() => expect(screen.getByText('External backup target')).toBeInTheDocument())
      expect(screen.queryByText(/transmitted unencrypted/i)).not.toBeInTheDocument()

      const label = screen.getByText('Require HTTPS').closest('label') as HTMLElement
      await user.click(label.querySelector('button') as HTMLElement)

      await waitFor(() => expect(screen.getByText(/transmitted unencrypted/i)).toBeInTheDocument())
    })

    // BKP-018: a failed probe must surface the reason, not a generic success
    it('FE-ADMIN-BKP-018: reports why a connection test failed', async () => {
      const user = userEvent.setup()
      server.use(
        http.get('/api/backup/target', () => HttpResponse.json(storedTarget)),
        http.post('/api/backup/target/test', () =>
          HttpResponse.json({ success: false, error: 'Bucket not found.' }),
        ),
      )
      render(<><ToastContainer /><BackupPanel /></>)

      await waitFor(() => expect(screen.getByText('External backup target')).toBeInTheDocument())
      await user.click(screen.getByRole('button', { name: /test connection/i }))

      await waitFor(() => expect(screen.getByText(/Bucket not found\./i)).toBeInTheDocument())
    })

    // BKP-022: an S3-only archive is still deletable — the server removes
    // whichever copies exist, so hiding the button strands it in the bucket.
    it('FE-ADMIN-BKP-022: offers delete and restore for an S3-only backup, but not download', async () => {
      server.use(
        http.get('/api/backup/list', () => HttpResponse.json({
          backups: [{ filename: 'backup-2025-01-15.zip', created_at: '2025-01-15T10:00:00Z', size: 2048000, local: false, remote: true }],
        })),
      )
      render(<><ToastContainer /><BackupPanel /></>)

      await waitFor(() => expect(screen.getByText('backup-2025-01-15.zip')).toBeInTheDocument())
      expect(screen.getByText('S3 only')).toBeInTheDocument()
      expect(screen.getByText('Restore')).toBeInTheDocument()
      // Download streams the file from disk, and there is no local file.
      expect(screen.queryByText('Download')).not.toBeInTheDocument()
      const row = screen.getByText('backup-2025-01-15.zip').closest('div')!.parentElement!.parentElement!
      expect(row.querySelectorAll('button').length).toBeGreaterThanOrEqual(2)
    })

    // BKP-023: a delete that only half-succeeded must not read as success
    it('FE-ADMIN-BKP-023: reports when the mirrored copy could not be removed', async () => {
      const user = userEvent.setup()
      server.use(
        http.get('/api/backup/list', () => HttpResponse.json({
          backups: [{ filename: 'backup-2025-01-15.zip', created_at: '2025-01-15T10:00:00Z', size: 2048000, local: true, remote: true }],
        })),
        http.delete('/api/backup/:filename', () => HttpResponse.json({ success: true, remoteError: 'Access denied.' })),
      )
      render(<><ToastContainer /><BackupPanel /></>)

      await waitFor(() => expect(screen.getByText('backup-2025-01-15.zip')).toBeInTheDocument())
      const row = screen.getByText('backup-2025-01-15.zip').closest('div')!.parentElement!.parentElement!
      const buttons = [...row.querySelectorAll('button')]
      await user.click(buttons[buttons.length - 1])

      await waitFor(() => expect(screen.getByText(/could not be removed/i)).toBeInTheDocument())
    })

    // BKP-020: a fully configured target that is switched off is the quiet
    // failure this feature exists to avoid — say so in the form.
    it('FE-ADMIN-BKP-020: warns when credentials are configured but mirroring is off', async () => {
      server.use(
        http.get('/api/backup/target', () => HttpResponse.json({ ...storedTarget, enabled: false })),
      )
      render(<><ToastContainer /><BackupPanel /></>)

      await waitFor(() => expect(screen.getByText(/backups stay on this server only/i)).toBeInTheDocument())
    })

    it('FE-ADMIN-BKP-021: does not warn once mirroring is on', async () => {
      server.use(http.get('/api/backup/target', () => HttpResponse.json(storedTarget)))
      render(<><ToastContainer /><BackupPanel /></>)

      await waitFor(() => expect(screen.getByText('External backup target')).toBeInTheDocument())
      expect(screen.queryByText(/backups stay on this server only/i)).not.toBeInTheDocument()
    })

    // BKP-019: gateways whose S3 API lives under a path (Supabase Storage,
    // some Ceph/Garage deployments) must survive the round-trip intact.
    it('FE-ADMIN-BKP-019: keeps a path-bearing endpoint URL intact when saving', async () => {
      const user = userEvent.setup()
      const supabase = 'https://ljdxzzlurgitgiafjvlo.storage.supabase.co/storage/v1/s3'
      let sent: Record<string, unknown> | null = null
      server.use(
        http.get('/api/backup/target', () =>
          HttpResponse.json({ ...storedTarget, endpoint: supabase, force_path_style: true }),
        ),
        http.put('/api/backup/target', async ({ request }) => {
          sent = (await request.json()) as Record<string, unknown>
          return HttpResponse.json({ ...storedTarget, endpoint: supabase, force_path_style: true })
        }),
      )
      render(<><ToastContainer /><BackupPanel /></>)

      await waitFor(() => expect(screen.getByText('External backup target')).toBeInTheDocument())
      expect((screen.getByLabelText('Endpoint URL') as HTMLInputElement).value).toBe(supabase)

      await user.clear(screen.getByLabelText('Bucket'))
      await user.type(screen.getByLabelText('Bucket'), 'trek')
      await user.click(screen.getByRole('button', { name: /save target/i }))

      await waitFor(() => expect(sent).not.toBeNull())
      expect(sent!.endpoint).toBe(supabase)
    })
  })
})
