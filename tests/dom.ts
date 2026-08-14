import { vi } from 'vitest'

/**
 * happy-dom performs no layout, so `getClientRects()` is always empty and the
 * visibility gate in discovery would drop every element. Stub visible boxes
 * for the duration of a DOM test.
 */
export function installVisibleRects(): void {
  vi.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue([{ width: 1, height: 1 } as DOMRect] as unknown as DOMRectList)
}
