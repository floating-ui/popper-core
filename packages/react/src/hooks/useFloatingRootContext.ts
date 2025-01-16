import * as React from 'react';
import {isElement} from '@floating-ui/utils/dom';
import type {FloatingRootContext, ReferenceElement} from '../types';
import type {ContextData, OpenChangeReason, Orientation} from '../types';
import {useEffectEvent} from './utils/useEffectEvent';
import {createPubSub} from '../utils/createPubSub';
import {useId} from './useId';
import {useFloatingParentNodeId} from '../components/FloatingTree';
import {error} from '../utils/log';

export interface UseFloatingRootContextOptions {
  open?: boolean;
  onOpenChange?: (
    open: boolean,
    event?: Event,
    reason?: OpenChangeReason,
  ) => void;
  orientation?: Orientation;
  elements: {
    reference: Element | null;
    floating: HTMLElement | null;
  };
}

export function useFloatingRootContext(
  options: UseFloatingRootContextOptions,
): FloatingRootContext {
  const {
    open = false,
    onOpenChange: onOpenChangeProp,
    elements: elementsProp,
    orientation = 'vertical',
  } = options;

  const floatingId = useId();
  const dataRef = React.useRef<ContextData>({});
  const [events] = React.useState(() => createPubSub());
  const nested = useFloatingParentNodeId() != null;

  if (__DEV__) {
    const optionDomReference = elementsProp.reference;
    if (optionDomReference && !isElement(optionDomReference)) {
      error(
        'Cannot pass a virtual element to the `elements.reference` option,',
        'as it must be a real DOM element. Use `refs.setPositionReference()`',
        'instead.',
      );
    }
  }

  const [positionReference, setPositionReference] =
    React.useState<ReferenceElement | null>(elementsProp.reference);

  const onOpenChange = useEffectEvent(
    (open: boolean, event?: Event, reason?: OpenChangeReason) => {
      dataRef.current.openEvent = open ? event : undefined;
      events.emit('openchange', {open, event, reason, nested});
      onOpenChangeProp?.(open, event, reason);
    },
  );

  const refs = React.useMemo(
    () => ({
      setPositionReference,
    }),
    [],
  );

  const elements = React.useMemo(
    () => ({
      reference: positionReference || elementsProp.reference || null,
      floating: elementsProp.floating || null,
      domReference: elementsProp.reference as Element | null,
    }),
    [positionReference, elementsProp.reference, elementsProp.floating],
  );

  return React.useMemo<FloatingRootContext>(
    () => ({
      dataRef,
      open,
      onOpenChange,
      elements,
      events,
      floatingId,
      orientation,
      refs,
    }),
    [open, onOpenChange, elements, events, floatingId, refs, orientation],
  );
}
