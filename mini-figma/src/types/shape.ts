/**
 * Единый «язык» проекта.
 * Всё, о чём говорят сразу несколько файлов (фигура, инструмент, координаты,
 * камера), описано здесь — TypeScript ловит ошибки до запуска.
 */

/** Вид фигуры: прямоугольник или эллипс */
export type ShapeKind = 'rectangle' | 'ellipse'

/** Инструмент холста */
export type Tool = 'select' | 'rectangle' | 'ellipse'

/** Точка: в экранных координатах — позиция мыши, в координатах канваса — позиция фигуры */
export interface Point {
  x: number
  y: number
}

/** Камера: сдвиг холста относительно экрана и масштаб */
export interface Viewport {
  /**
   * Сдвиг холста по X в экранных пикселях.
   * Точка мира (0, 0) отображается в экранную точку (viewport.x, viewport.y).
   */
  x: number
  /** Сдвиг холста по Y в экранных пикселях */
  y: number
  /** Масштаб: 0.1 — это 10 %, 1 — это 100 %, 4 — это 400 % */
  zoom: number
}

/** Фигура на холсте. Координаты — всегда в системе канваса (без зума и панорамирования). */
export interface Shape {
  id: string
  kind: ShapeKind
  x: number
  y: number
  width: number
  height: number
  /** Цвет заливки в формате CSS (#rrggbb) */
  fill: string
}
