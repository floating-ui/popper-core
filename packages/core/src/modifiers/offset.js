// @flow
import type { Placement } from '../enums';
import type { Modifier, ModifierArguments, Rect, Coords } from '../types';
import getBasePlacement from '../utils/getBasePlacement';
import { top, left, right } from '../enums';

type OffsetsFunction = ({
  popper: Rect,
  reference: Rect,
  placement: Placement,
}) => [?number, ?number];

export type Offset = OffsetsFunction | [?number, ?number];

export function convertTupleToCoords({
  placement,
  coords,
  rects,
  tuple,
}: {
  placement: Placement,
  coords: Coords,
  rects: { popper: Rect, reference: Rect },
  tuple: Offset,
}): Coords {
  const basePlacement = getBasePlacement(placement);
  const invertDistance = [left, top].includes(basePlacement) ? -1 : 1;

  let [skidding, distance] =
    typeof tuple === 'function' ? tuple({ ...rects, placement }) : tuple;

  skidding = skidding || 0;
  distance = (distance || 0) * invertDistance;

  return [left, right].includes(basePlacement)
    ? { x: coords.x + distance, y: coords.y + skidding }
    : { x: coords.x + skidding, y: coords.y + distance };
}

export const offset = (tuple: Offset): Modifier => ({
  name: 'offset',
  fn(modifierArguments: ModifierArguments) {
    const { placement, rects, coords } = modifierArguments;
    return convertTupleToCoords({ placement, rects, coords, tuple });
  },
});
