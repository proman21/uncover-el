import {
  Position,
  getElementCoordinatesByPositionRelativeToXY,
  getElementCoordinatesByPosition,
  getElementPositioning,
  ElViewportPosition,
} from './coordinates'
import { getWindow, getWindowByElement } from './dom'
import {
  findParent,
  isDescendent,
  isWithinShadowRoot,
  getFixedOrStickyEl,
  getFirstScrollableParent,
  getElementAtPointFromViewport,
} from './elements'
import { stringify } from './utils'

export interface PositionOptions {
  x?: number
  y?: number
  position?: Position
}
function getCoordinatesForEl(el: Element, options?: PositionOptions) {
  if (
    options?.x &&
    Number.isFinite(options.x) &&
    options?.y &&
    Number.isFinite(options.y)
  ) {
    return getElementCoordinatesByPositionRelativeToXY(el, options.x, options.y)
  }

  return getElementCoordinatesByPosition(el, options?.position)
}

function scrollTop(el: Element | Document | Window): number
function scrollTop(el: Element | Document | Window, value: number): void
function scrollTop(el: Element | Document | Window, value?: number) {
  const win = getWindow(el)

  if (value === undefined) {
    return win ? win.scrollY : (el as Element).scrollTop
  }

  if (win) {
    win.scrollTo(win.scrollX, value)
  } else {
    ;(el as Element).scrollTop = value
  }
}

function scrollLeft(el: Element | Document | Window): number
function scrollLeft(el: Element | Document | Window, value: number): void
function scrollLeft(el: Element | Document | Window, value?: number) {
  const win = getWindow(el)

  if (value === undefined) {
    return win ? win.scrollX : (el as Element).scrollLeft
  }

  if (win) {
    win.scrollTo(value, win.scrollY)
  } else {
    ;(el as Element).scrollLeft = value
  }
}

function scrollContainerPastElement(container: Element | Window, el: Element) {
  // get the width + height of the el
  // since this is what we are scrolling past!
  const { width, height } = getElementPositioning(el)

  // what is this container currently scrolled?
  // using jquery here which normalizes window scroll props
  const currentScrollTop = scrollTop(container)
  const currentScrollLeft = scrollLeft(container)

  // we want to scroll in the opposite direction (up not down)
  // so just decrease the scrolled positions
  scrollTop(container, currentScrollTop - height)
  scrollLeft(container, currentScrollLeft - width)
}

function ensureElHasPointerEvents(el: Element) {
  const win = getWindowByElement(el)
  const value = win.getComputedStyle(el).pointerEvents

  if (value === 'none') {
    const elInherited = findParent(el, (el, prevEl) => {
      if (win.getComputedStyle(el).pointerEvents !== 'none') {
        return prevEl
      }
    })

    const elementInherited = el !== elInherited && elInherited
    throw new Error(
      `${el} has CSS 'pointer-events: none'${
        elementInherited
          ? `, inherited from this element: ${elementInherited}`
          : ''
      }`,
    )
  }
}

function ensureIsDescendent(el1: Element, el2: Element | null) {
  if (!isDescendent(el1, el2)) {
    // when an element inside a shadow root is covered by its shadow host
    if (isWithinShadowRoot(el1) && el1.getRootNode() === el2?.shadowRoot) {
      return
    }

    const node = stringify(el1)
    if (el2) {
      const element2 = stringify(el2)
      throw new Error(`${node} is being covered by another element ${element2}`)
    }

    throw new Error(`The center of this element is hidden from view: ${node}`)
  }
}

function getAllScrollables(el: Element) {
  // nudge algorithm
  // starting at the element itself
  // walk up until and find all of the scrollable containers
  // until we reach null
  // then push in the window
  const scrollables: (Element | Window)[] = []
  let scrollableContainer = getFirstScrollableParent(el)

  while (scrollableContainer) {
    scrollables.push(scrollableContainer)
    scrollableContainer = getFirstScrollableParent(scrollableContainer)
  }

  scrollables.push(getWindowByElement(el))
  return scrollables
}

export function ensureElIsNotCovered(el: Element, options: PositionOptions) {
  let elAtCoords: Element | null = null
  let fromElViewport: Required<ElViewportPosition> = getCoordinatesForEl(
    el,
    options,
  ).fromElViewport as Required<ElViewportPosition>
  const win = getWindowByElement(el)

  function ensureDescendants(fromElViewport: Required<ElViewportPosition>) {
    elAtCoords = getElementAtPointFromViewport(
      win.document,
      fromElViewport.x,
      fromElViewport.y,
    )
    console.debug('elAtCoords', elAtCoords)
    // figure out the deepest element we are about to interact
    // with at these coordinates
    console.debug('el has pointer-events none?')
    ensureElHasPointerEvents(el)

    console.debug('is descendent of elAtCoords?')
    ensureIsDescendent(el, elAtCoords)

    return elAtCoords
  }

  // we want to scroll all of our containers until
  // this element becomes unhidden or retry async
  function scrollContainers(
    fixed: Element | null,
    scrollables: (Element | Window)[],
  ) {
    // hold onto all the elements we've scrolled
    // past in this cycle
    let elementsScrolledPast: Element[] = []

    function possiblyScrollMultipleTimes(
      fixed: Element | null,
      container: Element | Window,
    ) {
      // if we got something AND
      if (fixed && !elementsScrolledPast.includes(fixed)) {
        elementsScrolledPast.push(fixed)
        scrollContainerPastElement(container, fixed)

        try {
          // now that we've changed scroll positions
          // we must recalculate whether this element is covered
          // since the element's top / left positions change.
          fromElViewport = getCoordinatesForEl(el, options)
            .fromElViewport as Required<ElViewportPosition>
          // this is a relative calculation based on the viewport
          // so these are the only coordinates we care about
          return ensureDescendants(fromElViewport)
        } catch (err) {
          // we failed here, but before scrolling the next container
          // we need to first verify that the element covering up
          // is the same one as before our scroll
          const elAtCoords = getElementAtPointFromViewport(
            win.document,
            fromElViewport.x,
            fromElViewport.y,
          )

          if (elAtCoords) {
            // get the fixed element again
            const newFixed = getFixedOrStickyEl(elAtCoords)

            // and possibly recursively scroll past it
            // if we haven't see it before
            return possiblyScrollMultipleTimes(newFixed, container)
          }
          // getElementAtPoint was falsey, so target element is no longer in the viewport
          throw err
        }
      }
      return null
    }

    // pull off scrollables starting with the most outer
    // container which is window
    let scrollableContainer = scrollables.pop()
    while (scrollableContainer) {
      const ret = possiblyScrollMultipleTimes(fixed, scrollableContainer)
      if (ret) {
        return ret
      }

      elementsScrolledPast = []
      scrollableContainer = scrollables.pop()
    }
    // we've reach the end of all the scrollables
    // bail and just retry async
    return null
  }

  try {
    // use the initial coords fromElViewport
    return ensureDescendants(fromElViewport)
  } catch (err) {
    // if we're being covered by a fixed position element then
    // we're going to attempt to continuously scroll the element
    // from underneath this fixed position element until we can't
    // anymore
    const fixed = getFixedOrStickyEl(elAtCoords)

    console.debug('elAtCoords is fixed', !!fixed)

    // if we don't have a fixed position
    // then just bail, cuz we need to retry async
    if (!fixed) {
      throw err
    }

    // start nudging
    elAtCoords = scrollContainers(fixed, getAllScrollables(el))
    if (!elAtCoords) {
      throw err
    }
  }

  // return the final $elAtCoords
  return elAtCoords
}
