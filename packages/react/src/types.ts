import type {
  UseFloatingOptions as UsePositionOptions,
  UseFloatingReturn as UsePositionFloatingReturn,
  VirtualElement,
} from '@floating-ui/react-dom';
import type * as React from 'react';

import type {ExtendedUserProps} from './hooks/useInteractions';

export * from '.';
export type {FloatingArrowProps} from './components/FloatingArrow';
export type {FloatingFocusManagerProps} from './components/FloatingFocusManager';
export type {FloatingOverlayProps} from './components/FloatingOverlay';
export type {
  FloatingPortalProps,
  UseFloatingPortalNodeProps,
} from './components/FloatingPortal';
export type {CompositeProps, CompositeItemProps} from './components/Composite';
export type {UseClickProps} from './hooks/useClick';
export type {UseClientPointProps} from './hooks/useClientPoint';
export type {UseDismissProps} from './hooks/useDismiss';
export type {UseFocusProps} from './hooks/useFocus';
export type {UseHoverProps} from './hooks/useHover';
export type {UseListNavigationProps} from './hooks/useListNavigation';
export type {UseRoleProps} from './hooks/useRole';
export type {
  UseTransitionStatusProps,
  UseTransitionStylesProps,
} from './hooks/useTransition';
export type {UseTypeaheadProps} from './hooks/useTypeahead';
export type {UseFloatingRootContextOptions} from './hooks/useFloatingRootContext';
export type {InnerProps, UseInnerOffsetProps} from './_deprecated-inner';
export type {UseInteractionsReturn} from './hooks/useInteractions';
export type {SafePolygonOptions} from './safePolygon';
export type {
  FloatingTreeProps,
  FloatingNodeProps,
} from './components/FloatingTree';
export type {
  AlignedPlacement,
  Alignment,
  ArrowOptions,
  AutoPlacementOptions,
  AutoUpdateOptions,
  Axis,
  Boundary,
  ClientRectObject,
  ComputePositionConfig,
  ComputePositionReturn,
  Coords,
  DetectOverflowOptions,
  Dimensions,
  ElementContext,
  ElementRects,
  Elements,
  FlipOptions,
  FloatingElement,
  HideOptions,
  InlineOptions,
  Length,
  Middleware,
  MiddlewareArguments,
  MiddlewareData,
  MiddlewareReturn,
  MiddlewareState,
  NodeScroll,
  OffsetOptions,
  Padding,
  Placement,
  Platform,
  Rect,
  ReferenceElement,
  RootBoundary,
  ShiftOptions,
  Side,
  SideObject,
  SizeOptions,
  Strategy,
  VirtualElement,
} from '@floating-ui/react-dom';
export {
  arrow,
  autoPlacement,
  autoUpdate,
  computePosition,
  detectOverflow,
  flip,
  getOverflowAncestors,
  hide,
  inline,
  limitShift,
  offset,
  platform,
  shift,
  size,
} from '@floating-ui/react-dom';

type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type Orientation = 'horizontal' | 'vertical' | 'both';

export type OpenChangeReason =
  | 'outside-press'
  | 'escape-key'
  | 'ancestor-scroll'
  | 'reference-press'
  | 'click'
  | 'hover'
  | 'focus'
  | 'focus-out'
  | 'list-navigation'
  | 'safe-polygon';

export type NarrowedElement<T> = T extends Element ? T : Element;

export interface ExtendedRefs<RT> {
  reference: React.MutableRefObject<ReferenceType | null>;
  floating: React.MutableRefObject<HTMLElement | null>;
  domReference: React.MutableRefObject<NarrowedElement<RT> | null>;
  setReference(node: RT | null): void;
  setFloating(node: HTMLElement | null): void;
  setPositionReference(node: ReferenceType | null): void;
}

export interface ExtendedElements<RT> {
  reference: ReferenceType | null;
  floating: HTMLElement | null;
  domReference: NarrowedElement<RT> | null;
}

export interface FloatingEvents {
  emit<T extends string>(event: T, data?: any): void;
  on(event: string, handler: (data: any) => void): void;
  off(event: string, handler: (data: any) => void): void;
}

export interface ContextData {
  openEvent?: Event;
  floatingContext?: FloatingContext;
  /** @deprecated use `onTypingChange` prop in `useTypeahead` */
  typing?: boolean;
  [key: string]: any;
}

export interface FloatingRootContext<RT extends ReferenceType = ReferenceType> {
  dataRef: React.MutableRefObject<ContextData>;
  open: boolean;
  onOpenChange: (
    open: boolean,
    event?: Event,
    reason?: OpenChangeReason,
  ) => void;
  elements: {
    domReference: Element | null;
    reference: RT | null;
    floating: HTMLElement | null;
  };
  events: FloatingEvents;
  floatingId: string | undefined;
  refs: {
    setPositionReference(node: ReferenceType | null): void;
  };
}

export type FloatingContext<RT extends ReferenceType = ReferenceType> = Omit<
  UsePositionFloatingReturn<RT>,
  'refs' | 'elements'
> & {
  open: boolean;
  onOpenChange(open: boolean, event?: Event, reason?: OpenChangeReason): void;
  orientation?: Orientation;
  events: FloatingEvents;
  dataRef: React.MutableRefObject<ContextData>;
  nodeId: string | undefined;
  floatingId: string | undefined;
  refs: ExtendedRefs<RT>;
  elements: ExtendedElements<RT>;
};

export interface FloatingNodeType<RT extends ReferenceType = ReferenceType> {
  id: string | undefined;
  parentId: string | null;
  context?: FloatingContext<RT>;
}

export interface FloatingTreeType<RT extends ReferenceType = ReferenceType> {
  nodesRef: React.MutableRefObject<Array<FloatingNodeType<RT>>>;
  events: FloatingEvents;
  addNode(node: FloatingNodeType): void;
  removeNode(node: FloatingNodeType): void;
}

export interface ElementProps {
  reference?: React.HTMLProps<Element>;
  floating?: React.HTMLProps<HTMLElement>;
  item?:
    | React.HTMLProps<HTMLElement>
    | ((props: ExtendedUserProps) => React.HTMLProps<HTMLElement>);
}

export type ReferenceType = Element | VirtualElement;

export type UseFloatingData = Prettify<UseFloatingReturn>;

export type UseFloatingReturn<RT extends ReferenceType = ReferenceType> =
  Prettify<
    UsePositionFloatingReturn & {
      /**
       * `FloatingContext`
       */
      context: Prettify<FloatingContext<RT>>;
      /**
       * Object containing the reference and floating refs and reactive setters.
       */
      refs: ExtendedRefs<RT>;
      elements: ExtendedElements<RT>;
    }
  >;

export interface UseFloatingOptions<RT extends ReferenceType = ReferenceType>
  extends Omit<UsePositionOptions<RT>, 'elements'> {
  rootContext?: FloatingRootContext<RT>;
  /**
   * Object of external elements as an alternative to the `refs` object setters.
   */
  elements?: {
    /**
     * Externally passed reference element. Store in state.
     */
    reference?: Element | null;
    /**
     * Externally passed floating element. Store in state.
     */
    floating?: HTMLElement | null;
  };
  /**
   * An event callback that is invoked when the floating element is opened or
   * closed.
   */
  onOpenChange?(open: boolean, event?: Event, reason?: OpenChangeReason): void;
  /**
   * Unique node id when using `FloatingTree`.
   */
  nodeId?: string;
}
