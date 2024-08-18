import { isWindow, isDocument } from './dom'

export const stringify = (el: Element, form: 'short' | 'long' = 'long') => {
  if (typeof el === 'string') {
    return el
  }

  // if we are formatting the window object
  if (isWindow(el)) {
    return '<window>'
  }

  // if we are formatting the document object
  if (isDocument(el)) {
    return '<document>'
  }

  const long = () => {
    const clonedEl = el.cloneNode(true) as Element
    clonedEl.replaceChildren()
    const str = clonedEl.outerHTML

    const text = (el.textContent ?? '')
      .trim()
      .replace(/\s\s+/g, ' ')
      .slice(0, 10)
    const children = el.children.length

    if (children) {
      return str.replace('></', '>...</')
    }

    if (text) {
      return str.replace('></', `>${text}</`)
    }

    return str
  }

  const short = () => {
    const id = el.id
    const classAttr = el.getAttribute('class')
    let str = el.tagName.toLowerCase()

    if (id) {
      str += `#${id}`
    }

    // using attr here instead of class because
    // svg's return an SVGAnimatedString object
    // instead of a normal string when calling
    // the property 'class'
    if (classAttr) {
      str += `.${classAttr.split(/\s+/).join('.')}`
    }

    return `<${str}>`
  }

  switch (form) {
    case 'short':
      return short()
    case 'long':
      return long()
    default:
      return long()
  }
}
