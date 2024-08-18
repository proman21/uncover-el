import { getElementPositioning } from './coordinates'
import { getDocumentFromElement } from './dom'
import {
  getAllParents,
  getParent,
  isUndefinedOrHTMLBodyDoc,
  isDescendent,
  isAncestor,
  elOrAncestorIsFixedOrSticky,
  getElementAtPointFromViewport,
} from './elements'

function elHasOpacityZero(el: Element) {
  return getComputedStyle(el)['opacity'] === '0'
}

function elHasOverflowHidden(el: Element) {
  const computedStyle = getComputedStyle(el)
  const cssOverflow = [
    computedStyle.overflow,
    computedStyle.overflowY,
    computedStyle.overflowX,
  ]

  return cssOverflow.includes('hidden')
}

function isZeroLengthAndTransformNone(
  width: number,
  height: number,
  transform: string,
) {
  // From https://github.com/cypress-io/cypress/issues/5974,
  // we learned that when an element has non-'none' transform style value like "translate(0, 0)",
  // it is visible even with `height: 0` or `width: 0`.
  // That's why we're checking `transform === 'none'` together with elOffsetWidth/Height.

  return (
    (width <= 0 && transform === 'none') ||
    (height <= 0 && transform === 'none')
  )
}

function isZeroLengthAndOverflowHidden(
  width: number,
  height: number,
  overflowHidden: boolean,
) {
  return (width <= 0 && overflowHidden) || (height <= 0 && overflowHidden)
}

function elHasNoEffectiveWidthOrHeight(el: HTMLElement) {
  // Is the element's CSS width OR height, including any borders,
  // padding, and vertical scrollbars (if rendered) less than 0?
  //
  // elOffsetWidth:
  // If the element is hidden (for example, by setting style.display
  // on the element or one of its ancestors to "none"), then 0 is returned.

  // $el[0].getClientRects().length:
  // For HTML <area> elements, SVG elements that do not render anything themselves,
  // display:none elements, and generally any elements that are not directly rendered,
  // an empty list is returned.

  const style = getComputedStyle(el)
  const transform = style.getPropertyValue('transform')
  const width = el.offsetWidth
  const height = el.offsetHeight
  const overflowHidden = elHasOverflowHidden(el)

  return (
    isZeroLengthAndTransformNone(width, height, transform) ||
    isZeroLengthAndOverflowHidden(width, height, overflowHidden) ||
    el.getClientRects().length <= 0
  )
}

const fixedOrAbsoluteRe = /(fixed|absolute)/

function elDescendentsHavePositionFixedOrAbsolute(
  parent: Element,
  child: Element,
) {
  // create an array of all elements between parent and child
  // including child but excluding parent
  // and check if these have position fixed|absolute
  const parents = getAllParents(child, parent)
  const els = parents.concat([child])

  return els.some((el) => {
    return fixedOrAbsoluteRe.test(getComputedStyle(el).position)
  })
}

function elIsHiddenByAncestors(el: HTMLElement, origEl = el) {
  // walk up to each parent until we reach the body
  // if any parent has opacity: 0
  // or has an effective offsetHeight of 0
  // and its set overflow: hidden then our child element
  // is effectively hidden
  // -----UNLESS------
  // the parent or a descendent has position: absolute|fixed
  const parent = getParent(el)

  // stop if we've reached the body or html
  // in case there is no body
  // or if parent is the document which can
  // happen if we already have an <html> element
  if (isUndefinedOrHTMLBodyDoc(parent)) {
    return false
  }

  // a child can never have a computed opacity
  // greater than that of its parent
  // so if the parent has an opacity of 0, so does the child
  if (elHasOpacityZero(parent)) {
    return true
  }

  if (
    elHasOverflowHidden(parent) &&
    elHasNoEffectiveWidthOrHeight(parent as HTMLElement)
  ) {
    // if any of the elements between the parent and origEl
    // have fixed or position absolute
    return !elDescendentsHavePositionFixedOrAbsolute(parent, origEl)
  }

  // continue to recursively walk up the chain until we reach body or html
  return elIsHiddenByAncestors(parent as HTMLElement, origEl)
}

function elAtCenterPoint(el: Element) {
  const doc = getDocumentFromElement(el)
  const elProps = getElementPositioning(el)

  const { topCenter, leftCenter } = elProps.fromElViewport

  return getElementAtPointFromViewport(doc, leftCenter, topCenter)
}

function elIsNotElementFromPoint(el: Element) {
  // if we have a fixed position element that means
  // it is fixed 'relative' to the viewport which means
  // it MUST be available with elementFromPoint because
  // that is also relative to the viewport
  const elAtPoint = elAtCenterPoint(el)

  // if the element at point is not a descendent
  // of our $el then we know it's being covered or its
  // not visible
  if (isDescendent(el, elAtPoint)) {
    return false
  }

  // we also check if the element at point is a
  // parent since pointer-events: none
  // will cause elAtCenterPoint to fall through to parent
  const parent = getParent(el)
  if (
    (getComputedStyle(el).pointerEvents === 'none' ||
      (parent && getComputedStyle(parent).pointerEvents === 'none')) &&
    elAtPoint &&
    isAncestor(el, elAtPoint)
  ) {
    return false
  }

  return true
}

const OVERFLOW_PROPS = ['hidden', 'scroll', 'auto']

function elHasClippableOverflow(el: Element) {
  const computedStyle = getComputedStyle(el)
  return (
    OVERFLOW_PROPS.includes(computedStyle.overflow) ||
    OVERFLOW_PROPS.includes(computedStyle.overflowY) ||
    OVERFLOW_PROPS.includes(computedStyle.overflowX)
  )
}

function elHasPositionRelative(el: Element) {
  return getComputedStyle(el).position === 'relative'
}

function isChild(el: Element, maybeChild: Element) {
  const children = Array.from(el.children)

  if (children.length && children[0].nodeName === 'SHADOW-ROOT') {
    return isDescendent(el, maybeChild)
  }

  return children.indexOf(maybeChild) >= 0
}

function canClipContent(el: HTMLElement, ancestor: Element) {
  // can't clip without overflow properties
  if (!elHasClippableOverflow(ancestor)) {
    return false
  }

  // the closest parent with position relative, absolute, or fixed
  const offsetParent = el.offsetParent ?? el

  // even if ancestors' overflow is clippable, if the element's offset parent
  // is a parent of the ancestor, the ancestor will not clip the element
  // unless the element is position relative
  if (!elHasPositionRelative(el) && isAncestor(ancestor, offsetParent)) {
    return false
  }

  // even if ancestors' overflow is clippable, if the element's offset parent
  // is a child of the ancestor, the ancestor will not clip the element
  // unless the ancestor has position absolute
  if (elHasPositionAbsolute(offsetParent) && isChild(ancestor, offsetParent)) {
    return false
  }

  return true
}

function elHasPositionAbsolute(el: Element) {
  return getComputedStyle(el)['position'] === 'absolute'
}

function elIsOutOfBoundsOfAncestorsOverflow(
  el: HTMLElement,
  ancestor = getParent(el),
) {
  // no ancestor, not out of bounds!
  // if we've reached the top parent, which is not a normal DOM el
  // then we're in bounds all the way up, return false
  if (isUndefinedOrHTMLBodyDoc(ancestor)) {
    return false
  }

  if (canClipContent(el, ancestor)) {
    const elProps = getElementPositioning(el)
    const ancestorProps = getElementPositioning(ancestor)

    if (
      elHasPositionAbsolute(el) &&
      (ancestorProps.width === 0 || ancestorProps.height === 0)
    ) {
      return elIsOutOfBoundsOfAncestorsOverflow(el, getParent(ancestor))
    }

    // target el is out of bounds
    if (
      // target el is to the right of the ancestor's visible area
      elProps.fromElWindow.left >=
        ancestorProps.width + ancestorProps.fromElWindow.left ||
      // target el is to the left of the ancestor's visible area
      elProps.fromElWindow.left + elProps.width <=
        ancestorProps.fromElWindow.left ||
      // target el is under the ancestor's visible area
      elProps.fromElWindow.top >=
        ancestorProps.height + ancestorProps.fromElWindow.top ||
      // target el is above the ancestor's visible area
      elProps.fromElWindow.top + elProps.height <=
        ancestorProps.fromElWindow.top
    ) {
      return true
    }
  }

  return elIsOutOfBoundsOfAncestorsOverflow(el, getParent(ancestor))
}

export function isHiddenByAncestors(el: HTMLElement) {
  // we do some calculations taking into account the parents
  // to see if its hidden by a parent
  if (elIsHiddenByAncestors(el)) {
    return true // is hidden
  }

  if (elOrAncestorIsFixedOrSticky(el)) {
    return elIsNotElementFromPoint(el)
  }

  // else check if el is outside the bounds
  // of its ancestors overflow
  return elIsOutOfBoundsOfAncestorsOverflow(el)
}
