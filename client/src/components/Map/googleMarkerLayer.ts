/**
 * Place pins for the Google map, drawn through an OverlayView instead of
 * AdvancedMarkerElement.
 *
 * AdvancedMarkerElement is the modern API and would be the obvious choice, but
 * on a raster map it repositions in two phases: it rides along with a coarse
 * transform during a drag, and on idle it snaps back to its pre-drag screen
 * position and animates to the new one. Measured side by side against an
 * OverlayView pin at the same coordinate, the advanced marker jumped ~137px
 * back and took about 150ms to return while the overlay pin never left its
 * place. That read to the user as "it moves somewhere else and then comes back"
 * after every pan. A vector map would not do this, but vector rendering needs a
 * Map ID created in the Google Cloud console, which a self-hosted instance
 * cannot assume.
 *
 * An OverlayView positions its own DOM from the projection on every draw, so
 * the pins are wherever we put them and there is no second opinion. One overlay
 * holds every pin rather than one overlay each: a draw is a single pass over
 * the set, which is what keeps a 34-place trip cheap to pan.
 */

export interface PinInput {
  id: number
  lat: number
  lng: number
  element: HTMLElement
  onClick?: () => void
}

export interface MarkerLayer {
  /** Adds the pin, or moves/replaces the content of one already shown. */
  setPin(pin: PinInput): void
  /** Removes a pin by id. Unknown ids are ignored. */
  removePin(id: number): void
  /** The ids currently on the map. */
  ids(): number[]
  /** Detaches the whole layer. */
  destroy(): void
}

interface HeldPin {
  lat: number
  lng: number
  element: HTMLElement
}

/**
 * @param api the loaded Google Maps SDK slice
 * @param map the map to draw on
 */
export function createMarkerLayer(
  api: {
    OverlayView: typeof google.maps.OverlayView
    LatLng: typeof google.maps.LatLng
  },
  map: google.maps.Map,
): MarkerLayer {
  const pins = new Map<number, HeldPin>()

  // Subclassed here rather than at module scope: google.maps.OverlayView only
  // exists once the SDK has loaded.
  class PinOverlay extends api.OverlayView {
    private container: HTMLDivElement | null = null

    onAdd(): void {
      const container = document.createElement('div')
      // The pins position themselves inside this; it must not offset them.
      container.style.cssText = 'position:absolute;left:0;top:0;width:0;height:0;'
      this.container = container
      // overlayMouseTarget is the pane that receives pointer events, which the
      // hover popup and click-to-select both need.
      this.getPanes()?.overlayMouseTarget.appendChild(container)
      for (const pin of pins.values()) container.appendChild(pin.element)
    }

    draw(): void {
      const projection = this.getProjection()
      if (!projection || !this.container) return
      for (const pin of pins.values()) {
        const point = projection.fromLatLngToDivPixel(new api.LatLng(pin.lat, pin.lng))
        if (!point) continue
        // The element is centred on its coordinate, matching anchor:'center' on
        // the GL renderers — createMarkerElement draws a pin around its middle.
        pin.element.style.position = 'absolute'
        pin.element.style.left = `${point.x}px`
        pin.element.style.top = `${point.y}px`
        pin.element.style.transform = 'translate(-50%, -50%)'
      }
    }

    onRemove(): void {
      this.container?.remove()
      this.container = null
    }

    /** The pane element, once attached. Exposed so pins can be added later. */
    host(): HTMLDivElement | null {
      return this.container
    }
  }

  const overlay = new PinOverlay()
  overlay.setMap(map)

  return {
    setPin({ id, lat, lng, element, onClick }: PinInput): void {
      const existing = pins.get(id)
      if (existing && existing.element !== element) existing.element.remove()
      if (onClick) element.addEventListener('click', onClick)
      pins.set(id, { lat, lng, element })
      const host = overlay.host()
      if (host && element.parentElement !== host) host.appendChild(element)
      overlay.draw()
    },

    removePin(id: number): void {
      pins.get(id)?.element.remove()
      pins.delete(id)
    },

    ids(): number[] {
      return [...pins.keys()]
    },

    destroy(): void {
      for (const pin of pins.values()) pin.element.remove()
      pins.clear()
      overlay.setMap(null)
    },
  }
}
