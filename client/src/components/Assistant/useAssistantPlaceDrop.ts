import { type DragEvent, useState } from 'react';

import { useTripStore } from '../../store/tripStore';
import { mentionLabel } from './assistantMentionModel';
import { useInsertMention } from './useAssistantMentions';

/** The type `startPlaceDrag` writes; browsers list data types in lower case. */
const PLACE_TYPE = 'placeid';

function carriesPlace(e: DragEvent): boolean {
  return Array.from(e.dataTransfer.types).some((type) => type.toLowerCase() === PLACE_TYPE);
}

interface DropZone {
  onDragEnter: (e: DragEvent) => void;
  onDragOver: (e: DragEvent) => void;
  onDragLeave: (e: DragEvent) => void;
  onDrop: (e: DragEvent) => void;
}

/**
 * A place dragged from the sidebar or the map onto the chat goes into the
 * question as `@Name`, like a pick from the `@` list. Only a place of the trip
 * the planner shows is taken; every other drag (a booking file above all) is
 * left to the other handlers on the same chat. `dragging` lights the drop zone.
 */
export function useAssistantPlaceDrop(tripId: number): { dragging: boolean; dropZone: DropZone } {
  const here = useTripStore((s) => s.trip?.id === tripId);
  const insert = useInsertMention(tripId);
  const [dragging, setDragging] = useState(false);
  const takes = (e: DragEvent) => here && carriesPlace(e);

  const dropZone: DropZone = {
    onDragEnter: (e) => {
      if (!takes(e)) return;
      e.preventDefault();
      setDragging(true);
    },
    onDragOver: (e) => {
      if (!takes(e)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    },
    onDragLeave: (e) => {
      // Leaving for a child is not leaving the zone.
      if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
      setDragging(false);
    },
    onDrop: (e) => {
      if (!takes(e)) return;
      e.preventDefault();
      setDragging(false);
      const id = Number(e.dataTransfer.getData('placeId'));
      const place = useTripStore.getState().places.find((p) => p.id === id);
      const label = place ? mentionLabel(place.name) : '';
      if (!place || !label) return;
      insert({ kind: 'place', id: place.id, label });
      e.currentTarget.querySelector('textarea')?.focus();
    },
  };

  return { dragging, dropZone };
}

/** Several drop handlers on one element; each one looks only at the drags it takes. */
export function joinDropZones(...zones: DropZone[]): DropZone {
  return {
    onDragEnter: (e) => zones.forEach((z) => z.onDragEnter(e)),
    onDragOver: (e) => zones.forEach((z) => z.onDragOver(e)),
    onDragLeave: (e) => zones.forEach((z) => z.onDragLeave(e)),
    onDrop: (e) => zones.forEach((z) => z.onDrop(e)),
  };
}
