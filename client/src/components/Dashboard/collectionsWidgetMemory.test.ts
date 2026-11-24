// FE-COMP-COLMEMORY-001 to -002: how many lists the collections widget showed last time.
import { readShownCollections, rememberShownCollections } from './collectionsWidgetMemory';

afterEach(() => localStorage.clear());

describe('collectionsWidgetMemory', () => {
  it('FE-COMP-COLMEMORY-001: remembers the count, kept within the six badges the widget shows', () => {
    expect(readShownCollections()).toBeNull();
    rememberShownCollections(4);
    expect(readShownCollections()).toBe(4);
    rememberShownCollections(9);
    expect(readShownCollections()).toBe(6);
  });

  it('FE-COMP-COLMEMORY-002: ignores a value that is not a count', () => {
    localStorage.setItem('trek_dash_collections_shown', 'many');
    expect(readShownCollections()).toBeNull();
    localStorage.setItem('trek_dash_collections_shown', '42');
    expect(readShownCollections()).toBeNull();
  });
});
