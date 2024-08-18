import { Position } from './coordinates'
import { ensureElIsNotCovered, PositionOptions } from './scrolling'
import { isHiddenByAncestors } from './visibility'

export type ScrollBehavior = 'top' | 'bottom' | 'center'

export interface Options extends PositionOptions {
  retries?: number
  interval?: number
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
export type { PositionOptions, Position }
