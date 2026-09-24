import { describe, it, expect, vi, beforeEach } from 'vitest'
import { bookPageSetupSchema, bookSpreadSchema } from '@trek/shared'
import { fireEvent, render } from '../../helpers/render'
import { StudioCanvas } from '../../../src/components/Studio/StudioCanvas'
import { useStudioStore } from '../../../src/store/studioStore'

/**
 * Pictures let go over the sheet itself (#2064).
 *
 * A book is where you notice the photograph that never made it into the
 * journal, and the shortest way to put it on a page is to drop it there. The
 * canvas already took a drag from the content browser, which arrives as an id;
 * a drag from the desktop arrives as files, and the two must not be confused
 * for each other.
 *
 * A viewer gets neither: without a handler the browser keeps its default and
 * opens the picture in a tab, which is better than a page that swallows a drop
 * and does nothing with it.
 */

const page = bookPageSetupSchema.parse({})
const spread = bookSpreadSchema.parse({ id: 'sp-1', elements: [] })

const file = () => new File(['x'], 'shrine.jpg', { type: 'image/jpeg' })

/** A DataTransfer jsdom will hand back unchanged, files and types included. */
const transfer = (files: File[], extraTypes: string[] = []) => ({
  types: [...(files.length ? ['Files'] : []), ...extraTypes],
  files,
  getData: () => '',
  setData: () => {},
  dropEffect: '',
  effectAllowed: '',
})

function mount(onDropFiles?: (files: File[], at: { x: number; y: number }, id: string | null) => void) {
  render(
    <StudioCanvas
      spread={spread} spreadIndex={0} page={page} zoom={1} pxPerMm={2}
      bookView={false} dropLabel="drop" fileDropLabel="let go to add them"
      onDropFiles={onDropFiles}
    />,
  )
  return document.querySelector('.st-stage') as HTMLElement
}

beforeEach(() => {
  useStudioStore.setState({ selection: [] })
})

describe('a file dropped on the sheet', () => {
  it('says what letting go will do while the drag is over the page', () => {
    const stage = mount(vi.fn())

    fireEvent.dragOver(stage, { dataTransfer: transfer([file()]) })

    expect(document.querySelector('.st-file-veil')?.textContent).toBe('let go to add them')
  })

  it('takes the veil away again when the drag leaves', () => {
    const stage = mount(vi.fn())
    fireEvent.dragOver(stage, { dataTransfer: transfer([file()]) })

    fireEvent.dragLeave(stage)

    expect(document.querySelector('.st-file-veil')).toBeNull()
  })

  it('hands the files over with the point they landed on', () => {
    const onDropFiles = vi.fn()
    const stage = mount(onDropFiles)
    const dropped = [file(), file()]

    fireEvent.drop(stage, { dataTransfer: transfer(dropped) })

    expect(onDropFiles).toHaveBeenCalledTimes(1)
    const [files, at, target] = onDropFiles.mock.calls[0]
    expect(files).toEqual(dropped)
    expect(at).toEqual({ x: expect.any(Number), y: expect.any(Number) })
    expect(target).toBeNull()
  })

  /*
   * The panel's own drag carries an id and means "this picture, from the
   * journey". A file drag carrying it as well would be neither, so the id
   * wins: it is the one the canvas can place without a round trip.
   */
  it('leaves a drag from the content browser to the path that places an id', () => {
    const onDropFiles = vi.fn()
    const stage = mount(onDropFiles)

    fireEvent.drop(stage, {
      dataTransfer: { ...transfer([file()], ['application/x-trek-photo']), getData: () => '42' },
    })

    expect(onDropFiles).not.toHaveBeenCalled()
  })

  it('is not a drop target at all for a viewer', () => {
    const stage = mount(undefined)

    fireEvent.dragOver(stage, { dataTransfer: transfer([file()]) })
    fireEvent.drop(stage, { dataTransfer: transfer([file()]) })

    expect(document.querySelector('.st-file-veil')).toBeNull()
  })
})
