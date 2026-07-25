/**
 * A place's image_url that is directly displayable on a map marker and should
 * win over the auto-fetched provider thumbnail — a custom uploaded image (#1136)
 * or an inline data URL. Provider proxy URLs (/api/maps/place-photo/…) are
 * deliberately excluded: those still go through the downscale/thumb path so many
 * markers don't lag on zoom.
 */
export function isCustomPlaceImage(url: string | null | undefined): boolean {
  return !!url && (url.startsWith('/uploads/') || url.startsWith('data:'))
}
