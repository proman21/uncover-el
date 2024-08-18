import {
  isDocument,
  isWindow,
  getDocumentFromElement,
  getWindowByElement,
} from './dom'

export function isUndefinedOrHTMLBodyDoc(
  el: Node | null | undefined,
): el is null | undefined | HTMLBodyElement | HTMLHtmlElement | Document {
  return (
    !el || el.nodeName === 'body' || el.nodeName === 'html' || isDocument(el)
  )
}

export function getParent(el: Element) {
  const root = el.getRootNode()
  return (
    el.parentElement ??
    (root && isWithinShadowRoot(el) ? (root as ShadowRoot).host : null)
  )
}

export function findParent<T>(
  el: Element,
  condition: (parent: Element, node: Element) => T,
) {
  function collectParent(node: Element) {
    const parent = getParent(node)

    if (!parent) return null

    const parentMatchingCondition = condition(parent, node)

    if (parentMatchingCondition) return parentMatchingCondition

    return collectParent(parent)
  }

  return collectParent(el)
}

export function isDescendent(el1: Element, el2: Element | null) {
  return (
    !!el2 &&
    (el1 === el2 ||
      findParent(el2, (node) => {
        if (node === el1) {
          return node
        }
      }) === el1)
  )
}

export function getParentNode(el: Element) {
  // if the element has a direct parent element,
  // simply return it.
  if (el.parentElement) {
    return el.parentElement
  }

  const root = el.getRootNode()

  // if the element is inside a shadow root,
  // return the host of the root.
  if (root && isWithinShadowRoot(el)) {
    return (root as ShadowRoot).host
  }

  return null
}

export function getAllParents(el: Element, untilSelectorOrEl?: Element) {
  function collectParents(parents: Element[], node: Element) {
    const parent = getParentNode(node)

    if (!parent || (untilSelectorOrEl && parent === untilSelectorOrEl)) {
      return parents
    }

    return collectParents(parents.concat(parent), parent)
  }

  return collectParents([], el)
}

export function getElementAtPointFromViewport(
  doc: Document,
  x: number,
  y: number,
) {
  // first try the native elementFromPoint method
  const elFromPoint = doc.elementFromPoint(x, y)
  const elAtCoords = getShadowElementFromPoint(elFromPoint, x, y)

  return elAtCoords
}

export function isAncestor(el: Element, maybeAncestor: Element) {
  return getAllParents(el).indexOf(maybeAncestor) >= 0
}

export function isWithinShadowRoot(node: Element) {
  return node.getRootNode()?.toString() === '[object ShadowRoot]'
}

export function getShadowElementFromPoint(
  node: Element | null,
  x: number,
  y: number,
) {
  const nodeFromPoint = node?.shadowRoot?.elementFromPoint(x, y)

  if (!nodeFromPoint || nodeFromPoint === node) return node

  return getShadowElementFromPoint(nodeFromPoint, x, y)
}

const fixedOrStickyRe = /(fixed|sticky)/

export function getFixedOrStickyEl(el: Element | null) {
  if (isUndefinedOrHTMLBodyDoc(el)) {
    return null
  }

  if (fixedOrStickyRe.test(getComputedStyle(el)['position'])) {
    return el
  }

  // walk up the tree until we find an element
  // with a fixed/sticky position
  return findParent(el, (node) => {
    if (fixedOrStickyRe.test(getComputedStyle(node)['position'])) {
      return node
    }

    return null
  })
}

export function getFirstScrollableParent(el: Element) {
  if (isUndefinedOrHTMLBodyDoc(el)) {
    return null
  }

  return findParent(el, (node) => {
    // walk up the tree until we find a scrollable
    // parent
    if (isScrollable(node)) {
      return node
    }

    return null
  })
}

export function elOrAncestorIsFixedOrSticky(el: Element) {
  return !!getFixedOrStickyEl(el)
}

export function isScrollOrAuto(prop: string): prop is 'scroll' | 'auto' {
  return prop === 'scroll' || prop === 'auto'
}

export function isScrollable(el: Element) {
  function checkDocumentElement(win: Window, documentElement: Element) {
    // Check if body height is higher than window height
    if (win.innerHeight < documentElement.scrollHeight) {
      console.debug('isScrollable: window scrollable on Y')

      return true
    }

    // Check if body width is higher than window width
    if (win.innerWidth < documentElement.scrollWidth) {
      console.debug('isScrollable: window scrollable on X')

      return true
    }

    // else return false since the window is not scrollable
    return false
  }

  // if we're the window, we want to get the document's
  // element and check its size against the actual window
  if (isWindow(el)) {
    return checkDocumentElement(el, el.document.documentElement)
  }

  // window.getComputedStyle(el) will error if el is undefined
  if (!el) {
    return false
  }

  // If we're at the documentElement, we check its size against the window
  const documentElement = getDocumentFromElement(el).documentElement

  if (el === documentElement) {
    return checkDocumentElement(getWindowByElement(el), el)
  }

  // if we're any other element, we do some css calculations
  // to see that the overflow is correct and the scroll
  // area is larger than the actual height or width
  const { overflow, overflowY, overflowX } = window.getComputedStyle(el)

  // y axis
  // if our content height is less than the total scroll height
  if (el.clientHeight < el.scrollHeight) {
    // and our element has scroll or auto overflow or overflowX
    if (isScrollOrAuto(overflow) || isScrollOrAuto(overflowY)) {
      console.debug(
        'isScrollable: clientHeight < scrollHeight and scroll/auto overflow',
      )

      return true
    }
  }

  // x axis
  if (el.clientWidth < el.scrollWidth) {
    if (isScrollOrAuto(overflow) || isScrollOrAuto(overflowX)) {
      console.debug(
        'isScrollable: clientWidth < scrollWidth and scroll/auto overflow',
      )

      return true
    }
  }

  return false
}
