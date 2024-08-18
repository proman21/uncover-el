import { Position } from './coordinates'
import { ensureElIsNotCovered, PositionOptions } from './scrolling'
import { isHiddenByAncestors } from './visibility'

export type ScrollBehavior = 'top' | 'bottom' | 'center'

/**
 * Options to configure the uncover logic.
 */
export interface Options extends PositionOptions {
  /**
   * Number of times to retry scrolling.
   */
  retries?: number
  /**
   * Number of milliseconds to wait between attempts.
   */
  interval?: number
  /**
   * Viewport position where the element should be scrolled to.
   */
  scrollBehaviour?: ScrollBehavior
}

const scrollBehaviourOptionsMap: Record<ScrollBehavior, ScrollLogicalPosition> =
  {
    top: 'start',
    bottom: 'end',
    center: 'center',
  }

const DEFAULT_OPTIONS = {
  retries: 3,
  interval: 100,
  scrollBehaviour: 'top',
  x: 0,
  y: 0,
  position: 'top',
} satisfies Options

/**
 * Attempt to scroll to `el`, ensuring the element isn't covered by any fixed or sticky elements.
 * If it is covered, scroll any scrollable ancestors and check again if that uncovered the element.
 * @param el The element to scroll to
 * @param options A configuration object
 */
function uncover(el: HTMLElement, options: Options = {}) {
  const { retries, interval, scrollBehaviour, ...opts } = {
    ...DEFAULT_OPTIONS,
    ...options,
  }
  const scrollBlockBehaviour = scrollBehaviourOptionsMap[scrollBehaviour]

  function retryUncover(attempt: number) {
    if (attempt >= retries) {
      throw new Error(
        `Failed to uncover element after ${attempt + 1} attempt${attempt ? 's' : ''}`,
      )
    }
    console.debug('Retrying')
    setTimeout(
      () => requestAnimationFrame(() => attemptUncover(attempt + 1)),
      interval,
    )
  }

  function attemptUncover(attempt: number) {
    console.debug(
      `Uncover Attempt #${attempt + 1}${attempt ? ` (retry ${attempt} of ${retries})` : ''}`,
    )

    try {
      ensureElIsNotCovered(el, opts)
      if (isHiddenByAncestors(el)) {
        retryUncover(attempt)
      }
    } catch (e) {
      console.debug(e)
      retryUncover(attempt)
    }
  }

  el.scrollIntoView({ block: scrollBlockBehaviour })
  attemptUncover(0)
}

export default uncover
export { uncover }
export type { PositionOptions, Position }
