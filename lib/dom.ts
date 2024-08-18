export function isDocument(obj: Node | null): obj is Document {
  try {
    return (
      obj?.nodeType === window.Node.DOCUMENT_NODE ||
      obj?.nodeType === window.Node.DOCUMENT_FRAGMENT_NODE
    )
  } catch {
    return false
  }
}

export function getDocumentFromElement(el: Node) {
  if (isDocument(el)) {
    return el
  }

  return el.ownerDocument as Document
}

export function isWindow(obj: unknown): obj is Window {
  try {
    return Boolean(
      obj && typeof obj === 'object' && 'window' in obj && obj.window === obj,
    )
  } catch {
    return false
  }
}

export function getWindowByElement(el: Node | Window): Window {
  if (isWindow(el)) {
    return el
  }

  const doc = getDocumentFromElement(el)

  return doc.defaultView as Window
}

export function getWindow(el: Node | Window | null) {
  if (isWindow(el)) {
    return el
  }

  if (isDocument(el)) {
    return el.defaultView
  }

  return null
}
