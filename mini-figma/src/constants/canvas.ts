import type { ShapeKind } from '../types/shape'

/** Шаг мелкой сетки в координатах канваса */
export const GRID_STEP = 32

/** Крупная сетка идёт через каждые N мелких шагов */
export const GRID_MAJOR_EVERY = 4

/** Границы зума */
export const MIN_ZOOM = 0.1 // 10 %
export const MAX_ZOOM = 4 // 400 %

/** Заливка фигуры по умолчанию */
export const DEFAULT_FILL = '#bfd3f6'

/** Палитра для панели свойств */
export const SHAPE_COLORS = [
  '#bfd3f6',
  '#fca5a5',
  '#86efac',
  '#fde68a',
  '#c4b5fd',
  '#f9a8d4',
  '#94a3b8',
]

/** Размер маркера выделения в экранных пикселях (не зависит от зума) */
export const HANDLE_SIZE = 8

/** Минимальный размер фигуры (в координатах канваса), чтобы считать её нарисованной */
export const MIN_SHAPE_SIZE = 2

/** Цвет выделения */
export const SELECTED_STROKE = '#2563eb'

/** Цвет рамки при рисовании (предпросмотр) */
export const PREVIEW_STROKE = '#64748b'

/** Человекочитаемые названия видов фигур — общий язык для панелей */
export const SHAPE_KIND_LABELS: Record<ShapeKind, string> = {
  rectangle: 'Прямоугольник',
  ellipse: 'Эллипс',
}
