/**
 * counter.ts
 *
 * Simple counter utility for demo/testing purposes.
 *
 * Exports:
 * - setupCounter: Attach a click counter to a button element
 *
 * Author: Hera Health Solutions
 * Last updated: 2025-07-22
 */

/**
 * Attach a click counter to a button element.
 * @param element HTMLButtonElement to attach the counter to
 */
export function setupCounter(element: HTMLButtonElement) {
  let counter = 0
  const setCounter = (count: number) => {
    counter = count
    element.innerHTML = `count is ${counter}`
  }
  element.addEventListener('click', () => setCounter(counter + 1))
  setCounter(0)
}
