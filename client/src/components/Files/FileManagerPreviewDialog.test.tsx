import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '../../../tests/helpers/render';

const downloadFile = vi.fn(async (_url: string, _name: string) => {});

vi.mock('../../utils/fileDownload', () => ({
  openFile: vi.fn(async () => {}),
  downloadFile: (url: string, name: string) => downloadFile(url, name),
}));

import { FilePreviewDialog } from './FileManagerPreviewDialog';

const t = (key: string) => key;

function renderDialog(overrides: Partial<Parameters<typeof FilePreviewDialog>[0]> = {}) {
  const props = {
    name: 'plan.pdf',
    url: '/uploads/files/plan.pdf',
    onClose: vi.fn(),
    onOpenInTab: vi.fn(),
    t,
    width: 'wide' as const,
    bodyClassName: 'preview-body',
    iconClassName: 'text-danger',
    children: <p>the body</p>,
    ...overrides,
  };
  return { props, ...render(<FilePreviewDialog {...props} />) };
}

beforeEach(() => {
  downloadFile.mockReset();
  downloadFile.mockResolvedValue(undefined);
});

describe('FilePreviewDialog', () => {
  it('names the dialog after the file and shows the body it is given', () => {
    const { baseElement } = renderDialog();
    const dialog = screen.getByRole('dialog');
    const title = screen.getByText('plan.pdf');
    expect(dialog).toHaveAttribute('aria-labelledby', title.id);
    expect(screen.getByText('the body')).toBeInTheDocument();
    expect(baseElement.querySelector('.preview-body')).not.toBeNull();
    expect(baseElement.querySelector('svg.text-danger')).not.toBeNull();
  });

  it('opens the file in a new tab from the first pill', () => {
    const { props } = renderDialog();
    fireEvent.click(screen.getByText('files.openTab'));
    expect(props.onOpenInTab).toHaveBeenCalledTimes(1);
  });

  it('downloads the stored url under the file name from the second pill', () => {
    renderDialog({ name: 'notes.md', url: '/uploads/files/notes.md' });
    fireEvent.click(screen.getByText('files.download'));
    expect(downloadFile).toHaveBeenCalledWith('/uploads/files/notes.md', 'notes.md');
  });

  it('falls back to an English label when the key has no translation', () => {
    renderDialog({ t: (key: string) => (key === 'files.download' ? '' : key) });
    expect(screen.getByText('Download')).toBeInTheDocument();
  });
});
