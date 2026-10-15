import type { Point, Viewport } from '../types/shape'

/**
 * Пересчитывает точку из экранных координат (например, позиция мыши)
 * в координаты канваса с учётом сдвига и зума.
 *
 * Экран = мир × зум + сдвиг, отсюда: мир = (экран − сдвиг) / зум.
 * Без этого пересчёта фигуры «уезжают» относительно курсора при зуме и сдвиге холста.
 */
export function screenToCanvas(point: Point, viewport: Viewport): Point {
  return {
    x: (point.x - viewport.x) / viewport.zoom,
    y: (point.y - viewport.y) / viewport.zoom,
  }
}

/** Обратный пересчёт: координаты канваса → экранная позиция */
export function canvasToScreen(point: Point, viewport: Viewport): Point {
  return {
    x: point.x * viewport.zoom + viewport.x,
    y: point.y * viewport.zoom + viewport.y,
  }
}
