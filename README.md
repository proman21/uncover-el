# Uncover-El :mag:

> Reveal to me that which is hidden, unveil to me what is forbidden.

A smol library to scroll a page to an element. Adapted from Cypress's actionability code.

## Features

- Quickly scrolls to an element
- Will retry scrolling to account for layout changes
- Configurable detection of covering elements

## Installation

### NPM and JSR

This library is available on NPM as `uncover-el`.

```console
npm install uncover-el
```

It is also available on JSR as `@synthsym/uncover-el`.

```console
npx jsr add @synthsym/uncover-el
```

### From Github Releases

We also provide ESM and UMD builds from the Github Release CDN. Visit the [Releases](https://github.com/proman21/uncover-el/releases) page for more information.

## Usage

The default export of the library is a function that takes a `HTMLElement` and an optional configuration object.

```js
import uncover from 'uncover-el'

const hiddenEl = document.getElementById('hiddenEl')
await uncover(hiddenEl)
```

The configurable options are listed below.

| Name            | Type                                                                                                            | Default | Description                                                                  |
| --------------- | --------------------------------------------------------------------------------------------------------------- | ------- | ---------------------------------------------------------------------------- |
| retries         | `number`                                                                                                        | `3`     | Number of times to retry scrolling.                                          |
| interval        | `number`                                                                                                        | `100`   | Number of milliseconds to wait between retries.                              |
| x               | `number`                                                                                                        | `0`     | X-axis offset from the position anchor of the element to check for coverage. |
| y               | `number`                                                                                                        | `0`     | Y-axis offset from the position anchor of the element to check for coverage. |
| scrollBehaviour | `'top' \| 'bottom' \| 'center'`                                                                                 | `'top'` | Where on the element to perform the first scroll.                            |
| position        | `'top' \| 'topLeft' \| 'topRight' \| 'left' \| 'center' \| 'right' \| 'bottomLeft' \| 'bottom'\| 'bottomRight'` | `'top'` | The anchor of the the element used to determine if the element in covered.   |
