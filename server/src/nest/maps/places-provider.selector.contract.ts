/**
 * The keyed places provider, published for the routing relay: directions are
 * requested from the same Amap key the place search already resolved for the
 * user, so the relay asks this selector instead of reaching into maps' files.
 */
export { PlacesProviderSelector } from './places-provider.selector';
