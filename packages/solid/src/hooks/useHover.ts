import {isElement} from '@floating-ui/utils/dom';
import {
  contains,
  getDocument,
  isMouseLikePointerType,
} from '@floating-ui/utils/react';
import {destructure} from '@solid-primitives/destructure';
import {Accessor, createEffect, mergeProps, onCleanup} from 'solid-js';

import {
  useFloatingParentNodeId,
  useFloatingTree,
} from '../components/FloatingTree';
import type {
  ElementProps,
  FloatingContext,
  FloatingTreeType,
  ReferenceType,
} from '../types';
import {createAttribute} from '../utils/createAttribute';
// import {useLatestRef} from './utils/useLatestRef';

const safePolygonIdentifier = createAttribute('safe-polygon');

export interface HandleCloseFn<RT extends ReferenceType = ReferenceType> {
  (
    context: FloatingContext<RT> & {
      onClose: () => void;
      tree?: FloatingTreeType<RT> | null;
      leave?: boolean;
    }
  ): (event: MouseEvent) => void;
  __options: {
    blockPointerEvents: boolean;
  };
}

export function getDelay(
  value: UseHoverProps['delay'],
  prop: 'open' | 'close',
  pointerType?: PointerEvent['pointerType']
) {
  if (pointerType && !isMouseLikePointerType(pointerType)) {
    return 0;
  }

  if (typeof value === 'number') {
    return value;
  }

  return value?.[prop];
}

export interface UseHoverProps<RT extends ReferenceType = ReferenceType> {
  enabled?: Accessor<boolean>;
  handleClose?: HandleCloseFn<RT>;
  restMs?: number;
  delay?: number | Partial<{open: number; close: number}>;
  mouseOnly?: boolean;
  move?: boolean;
}

/**
 * Opens the floating element while hovering over the reference element, like
 * CSS `:hover`.
 * @see https://floating-ui.com/docs/useHover
 */
export function useHover<RT extends ReferenceType = ReferenceType>(
  context: FloatingContext<RT>,
  props: UseHoverProps<RT> = {}
): ElementProps {
  const {
    open,
    onOpenChange,
    dataRef,
    events,
    // elements: {domReference, floating},
    refs,
  } = context;
  const mergedProps = mergeProps(
    {
      enabled: () => true,
      delay: 0,
      handleClose: null,
      mouseOnly: false,
      restMs: 0,
      move: true,
    },
    props
  );
  const {delay, mouseOnly, restMs, move} = destructure(mergedProps);
  const {enabled, handleClose} = mergedProps;
  const tree = useFloatingTree<RT>();
  // const tree = useFloatingTree();
  const parentId = useFloatingParentNodeId();
  const handleCloseRef = handleClose;
  const delayRef = delay;

  let pointerTypeRef: string | undefined;
  let timeoutRef: any;
  let handlerRef: (event: MouseEvent) => void | null | undefined;
  let restTimeoutRef: any;
  let blockMouseMoveRef = true;
  let performedPointerEventsMutationRef = false;
  let unbindMouseMoveRef = () => {};

  const isHoverOpen = () => {
    const type = dataRef.openEvent?.type;
    return type?.includes('mouse') && type !== 'mousedown';
  };

  // When dismissing before opening, clear the delay timeouts to cancel it
  // from showing.
  createEffect(() => {
    if (!enabled()) {
      return;
    }

    function onDismiss() {
      clearTimeout(timeoutRef);
      clearTimeout(restTimeoutRef);
      blockMouseMoveRef = true;
    }

    events.on('dismiss', onDismiss);
    return () => {
      events.off('dismiss', onDismiss);
    };
  });

  createEffect(() => {
    if (!enabled() || !handleClose || !open()) {
      return;
    }

    function onLeave(event: MouseEvent) {
      if (isHoverOpen()) {
        onOpenChange(false, event);
      }
    }

    const html = getDocument(refs.floating()).documentElement;
    html.addEventListener('mouseleave', onLeave);
    return () => {
      html.removeEventListener('mouseleave', onLeave);
    };
  });

  const closeWithDelay = (event: Event, runElseBranch = true) => {
    const closeDelay = getDelay(delayRef(), 'close', pointerTypeRef);
    if (closeDelay && !handlerRef) {
      clearTimeout(timeoutRef);
      timeoutRef = setTimeout(() => onOpenChange(false, event), closeDelay);
    } else if (runElseBranch) {
      clearTimeout(timeoutRef);
      onOpenChange(false, event);
    }
  };

  const cleanupMouseMoveHandler = () => {
    unbindMouseMoveRef();
    handlerRef = () => undefined;
  };

  const clearPointerEvents = () => {
    if (performedPointerEventsMutationRef) {
      const body = getDocument(refs.floating()).body;
      body.style.pointerEvents = '';
      body.removeAttribute(safePolygonIdentifier);
      performedPointerEventsMutationRef = false;
    }
  };

  // Registering the mouse events on the reference directly to bypass React's
  // delegation system. If the cursor was on a disabled element and then entered
  // the reference (no gap), `mouseenter` doesn't fire in the delegation system.
  createEffect(() => {
    if (!enabled()) {
      return;
    }

    function isClickLikeOpenEvent() {
      return dataRef.openEvent
        ? ['click', 'mousedown'].includes(dataRef.openEvent.type)
        : false;
    }

    function onMouseEnter(event: MouseEvent) {
      clearTimeout(timeoutRef);
      blockMouseMoveRef = false;

      if (
        (mouseOnly() && !isMouseLikePointerType(pointerTypeRef)) ||
        (restMs() > 0 && getDelay(delayRef(), 'open') === 0)
      ) {
        return;
      }

      const openDelay = getDelay(delayRef(), 'open', pointerTypeRef);

      if (openDelay) {
        timeoutRef = setTimeout(() => {
          onOpenChange(true, event);
        }, openDelay);
      } else {
        onOpenChange(true, event);
      }
    }

    function onMouseLeave(event: MouseEvent) {
      if (isClickLikeOpenEvent()) {
        return;
      }

      unbindMouseMoveRef();

      const doc = getDocument(refs.floating());
      clearTimeout(restTimeoutRef);

      if (handleCloseRef) {
        // Prevent clearing `onScrollMouseLeave` timeout.
        if (!open()) {
          clearTimeout(timeoutRef);
        }

        handlerRef = handleCloseRef({
          ...context,
          tree: tree(),
          x: event.clientX,
          y: event.clientY,
          onClose() {
            clearPointerEvents();
            cleanupMouseMoveHandler();
            // Should the event expose that it was closed by `safePolygon`?
            closeWithDelay(event);
          },
        });

        const handler = handlerRef;

        doc.addEventListener('mousemove', handler);
        unbindMouseMoveRef = () => {
          doc.removeEventListener('mousemove', handler);
        };

        return;
      }

      // Allow interactivity without `safePolygon` on touch devices. With a
      // pointer, a short close delay is an alternative, so it should work
      // consistently.
      const shouldClose =
        pointerTypeRef === 'touch'
          ? !contains(refs.floating(), event.relatedTarget as Element | null)
          : true;
      if (shouldClose) {
        closeWithDelay(event);
      }
    }

    // Ensure the floating element closes after scrolling even if the pointer
    // did not move.
    // https://github.com/floating-ui/floating-ui/discussions/1692
    function onScrollMouseLeave(event: MouseEvent) {
      if (isClickLikeOpenEvent()) {
        return;
      }

      handleCloseRef?.({
        ...context,
        tree: tree(),
        x: event.clientX,
        y: event.clientY,
        onClose() {
          clearPointerEvents();
          cleanupMouseMoveHandler();
          closeWithDelay(event);
        },
      })(event);
    }

    if (isElement(refs.reference())) {
      const ref = refs.reference() as unknown as HTMLElement;
      open() && ref.addEventListener('mouseleave', onScrollMouseLeave);
      refs.floating()?.addEventListener('mouseleave', onScrollMouseLeave);
      move() && ref.addEventListener('mousemove', onMouseEnter, {once: true});
      ref.addEventListener('mouseenter', onMouseEnter);
      ref.addEventListener('mouseleave', onMouseLeave);
      return () => {
        open() && ref.removeEventListener('mouseleave', onScrollMouseLeave);
        refs.floating()?.removeEventListener('mouseleave', onScrollMouseLeave);
        move() && ref.removeEventListener('mousemove', onMouseEnter);
        ref.removeEventListener('mouseenter', onMouseEnter);
        ref.removeEventListener('mouseleave', onMouseLeave);
      };
    }
  });

  // Block pointer-events of every element other than the reference and floating
  // while the floating element is open and has a `handleClose` handler. Also
  // handles nested floating elements.
  // https://github.com/floating-ui/floating-ui/issues/1722
  createEffect(() => {
    if (!enabled()) {
      return;
    }

    if (
      open() &&
      handleCloseRef?.__options.blockPointerEvents &&
      isHoverOpen()
    ) {
      const floating = refs.floating();
      const domReference = refs.reference();
      const body = getDocument(floating).body;
      body.setAttribute(safePolygonIdentifier, '');
      body.style.pointerEvents = 'none';
      performedPointerEventsMutationRef = true;

      if (isElement(domReference) && floating) {
        const ref = domReference as unknown as HTMLElement | SVGSVGElement;

        const parentFloating = tree()
          ?.nodesRef.find((node) => node.id === parentId)
          ?.context?.refs.floating();

        if (parentFloating) {
          parentFloating.style.pointerEvents = '';
        }

        ref.style.pointerEvents = 'auto';
        floating.style.pointerEvents = 'auto';

        onCleanup(() => {
          ref.style.pointerEvents = '';
          floating.style.pointerEvents = '';
        });
      }
    }
  });

  createEffect(() => {
    if (!open()) {
      pointerTypeRef = undefined;
      cleanupMouseMoveHandler();
      clearPointerEvents();
    }
  });

  onCleanup(() => {
    cleanupMouseMoveHandler();
    clearTimeout(timeoutRef);
    clearTimeout(restTimeoutRef);
    clearPointerEvents();
  });

  if (!enabled) return {};

  function setPointerRef(event: PointerEvent) {
    pointerTypeRef = event.pointerType;
  }

  return {
    reference: {
      onPointerDown: setPointerRef,
      onPointerEnter: setPointerRef,
      onMouseMove(event) {
        if (open() || restMs() === 0) {
          return;
        }

        clearTimeout(restTimeoutRef);
        restTimeoutRef = setTimeout(() => {
          if (!blockMouseMoveRef) {
            onOpenChange(true, event);
          }
        }, restMs());
      },
    },
    floating: {
      onMouseEnter() {
        clearTimeout(timeoutRef);
      },
      onMouseLeave(event) {
        events.emit('dismiss', {
          type: 'mouseLeave',
          data: {
            returnFocus: false,
          },
        });
        closeWithDelay(event, false);
      },
    },
  };
}
