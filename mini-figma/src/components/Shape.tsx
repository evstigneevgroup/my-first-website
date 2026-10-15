import {
  DEFAULT_FILL,
  HANDLE_SIZE,
  PREVIEW_STROKE,
  SELECTED_STROKE,
} from '../constants/canvas'
import type { Shape as ShapeModel } from '../types/shape'

interface ShapeProps {
  shape: ShapeModel
  selected?: boolean
  /** Предпросмотр во время рисования: пунктирная рамка */
  preview?: boolean
  /** Текущий зум — чтобы маркеры выделения не увеличивались вместе с холстом */
  zoom?: number
}

/** vector-effect держит толщину контура в экранных пикселях при любом зуме */
const STROKE_EFFECT = { vectorEffect: 'non-scaling-stroke' as const }

/** Рендер одной фигуры в координатах канваса + рамка с маркерами при выделении */
export function Shape({ shape, selected = false, preview = false, zoom = 1 }: ShapeProps) {
  const fill = shape.fill ?? DEFAULT_FILL
  const stroke = preview ? PREVIEW_STROKE : selected ? SELECTED_STROKE : 'transparent'
  /* В предпросмотре контур тоньше — рамку выделения рисуем отдельно */
  const strokeWidth = preview ? 1.5 : 2
  const geometry = {
    fill,
    stroke,
    strokeWidth,
    ...STROKE_EFFECT,
    strokeDasharray: preview ? '4 3' : undefined,
  }

  const body =
    shape.kind === 'ellipse' ? (
      <ellipse
        cx={shape.x + shape.width / 2}
        cy={shape.y + shape.height / 2}
        rx={Math.abs(shape.width / 2)}
        ry={Math.abs(shape.height / 2)}
        {...geometry}
      />
    ) : (
      <rect
        x={shape.x}
        y={shape.y}
        width={shape.width}
        height={shape.height}
        {...geometry}
      />
    )

  return (
    <>
      {body}
      {selected && shape.width > 0 && shape.height > 0 && (
        <SelectionFrame shape={shape} zoom={zoom} />
      )}
    </>
  )
}

/** Рамка выделения: контур вокруг фигуры и 8 маркеров по углам и серединам сторон */
function SelectionFrame({ shape, zoom }: { shape: ShapeModel; zoom: number }) {
  /* Маркер задан в экранных пикселях — переводим в координаты канваса, деля на зум */
  const size = HANDLE_SIZE / zoom
  const half = size / 2

  const xs = [shape.x, shape.x + shape.width / 2, shape.x + shape.width]
  const ys = [shape.y, shape.y + shape.height / 2, shape.y + shape.height]
  const centerX = shape.x + shape.width / 2
  const centerY = shape.y + shape.height / 2
  /* 8 маркеров: 4 угла + 4 середины сторон. Центральный маркер, как в Figma, не нужен */
  const handles: Array<[number, number]> = []
  for (const x of xs) {
    for (const y of ys) {
      if (x === centerX && y === centerY) continue
      handles.push([x, y])
    }
  }

  return (
    <g>
      <rect
        x={shape.x}
        y={shape.y}
        width={shape.width}
        height={shape.height}
        fill="none"
        stroke={SELECTED_STROKE}
        strokeWidth={1.5}
        {...STROKE_EFFECT}
      />
      {handles.map(([x, y]) => (
        <rect
          key={`${x}-${y}`}
          x={x - half}
          y={y - half}
          width={size}
          height={size}
          fill="#ffffff"
          stroke={SELECTED_STROKE}
          strokeWidth={1.5}
          {...STROKE_EFFECT}
        />
      ))}
    </g>
  )
}
