import { useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import {
  DEFAULT_FILL,
  GRID_MAJOR_EVERY,
  GRID_STEP,
  MIN_SHAPE_SIZE,
} from '../constants/canvas'
import type { ShapeDraft } from '../hooks/useShapes'
import { useViewport } from '../hooks/useViewport'
import type { Point, ShapeKind, Shape as ShapeModel, Tool, Viewport } from '../types/shape'
import { screenToCanvas } from '../utils/geometry'
import { Shape } from './Shape'

interface CanvasProps {
  tool: Tool
  shapes: ShapeModel[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  onAddShape: (draft: ShapeDraft) => string
  onMoveShape: (id: string, patch: Partial<Omit<ShapeModel, 'id'>>) => void
  /** Запомнить состояние перед перетаскиванием — чтобы Undo вернул фигуру на место */
  onBeginHistory: () => void
}

/** Построить прямоугольник по двум точкам (тянем в любую сторону) */
function rectFromPoints(a: Point, b: Point): Omit<ShapeModel, 'id' | 'fill' | 'kind'> {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(b.x - a.x),
    height: Math.abs(b.y - a.y),
  }
}

/** Есть ли точка внутри фигуры (сверху вниз: верхняя выигрывает) */
function hitTest(point: Point, shapes: ShapeModel[]): ShapeModel | null {
  for (let i = shapes.length - 1; i >= 0; i -= 1) {
    const shape = shapes[i]
    if (shape.width <= 0 || shape.height <= 0) continue

    if (shape.kind === 'ellipse') {
      const rx = shape.width / 2
      const ry = shape.height / 2
      const dx = (point.x - (shape.x + rx)) / rx
      const dy = (point.y - (shape.y + ry)) / ry
      if (dx * dx + dy * dy <= 1) return shape
    } else if (
      point.x >= shape.x &&
      point.x <= shape.x + shape.width &&
      point.y >= shape.y &&
      point.y <= shape.y + shape.height
    ) {
      return shape
    }
  }
  return null
}

/** Сетка движется вместе с камерой: сдвиг фона = сдвиг холста, шаг = шаг сетки × зум */
function createGridStyle(viewport: Viewport): CSSProperties {
  const step = GRID_STEP * viewport.zoom
  const major = step * GRID_MAJOR_EVERY

  return {
    backgroundImage: [
      'linear-gradient(to right, rgba(148, 163, 184, 0.20) 1px, transparent 1px)',
      'linear-gradient(to bottom, rgba(148, 163, 184, 0.20) 1px, transparent 1px)',
      'linear-gradient(to right, rgba(100, 116, 139, 0.32) 1px, transparent 1px)',
      'linear-gradient(to bottom, rgba(100, 116, 139, 0.32) 1px, transparent 1px)',
    ].join(', '),
    backgroundSize: `${step}px ${step}px, ${step}px ${step}px, ${major}px ${major}px, ${major}px ${major}px`,
    backgroundPosition: `${viewport.x}px ${viewport.y}px`,
  }
}

/** Холст на весь экран: сетка на фоне, слой фигур и события мыши */
export function Canvas({
  tool,
  shapes,
  selectedId,
  onSelect,
  onAddShape,
  onMoveShape,
  onBeginHistory,
}: CanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const { viewport, isSpacePressed, isPanning, startPan, movePan, endPan } =
    useViewport(canvasRef)

  /* Предпросмотр фигуры во время рисования */
  const [draft, setDraft] = useState<ShapeModel | null>(null)
  const drawStart = useRef<Point | null>(null)
  const drawKind = useRef<ShapeKind | null>(null)
  const draftRef = useRef<ShapeModel | null>(null)
  /* Перетаскивание фигуры */
  const drag = useRef<{ id: string; pointer: Point; origin: Point; moved: boolean } | null>(null)

  const toCanvas = (event: { clientX: number; clientY: number }): Point =>
    screenToCanvas({ x: event.clientX, y: event.clientY }, viewport)

  const updateDraft = (next: ShapeModel | null): void => {
    draftRef.current = next
    setDraft(next)
  }

  const cursorClass = isPanning
    ? 'cursor-grabbing'
    : isSpacePressed
      ? 'cursor-grab'
      : tool === 'select'
        ? 'cursor-default'
        : 'cursor-crosshair'

  return (
    <div
      ref={canvasRef}
      className={`relative h-full w-full select-none overflow-hidden bg-slate-50 ${cursorClass}`}
      style={createGridStyle(viewport)}
      onPointerDown={(event) => {
        const point = toCanvas(event)

        /* Пробел зажат — панорамирование (приоритет выше инструментов) */
        if (isSpacePressed) {
          event.currentTarget.setPointerCapture(event.pointerId)
          startPan({ x: event.clientX, y: event.clientY })
          return
        }

        if (tool === 'select') {
          const hit = hitTest(point, shapes)
          onSelect(hit ? hit.id : null)
          if (hit) {
            event.currentTarget.setPointerCapture(event.pointerId)
            drag.current = {
              id: hit.id,
              pointer: point,
              origin: { x: hit.x, y: hit.y },
              moved: false,
            }
          }
          return
        }

        /* Инструменты рисования: старт предпросмотра */
        event.currentTarget.setPointerCapture(event.pointerId)
        drawStart.current = point
        drawKind.current = tool
        updateDraft({ id: '__draft__', kind: tool, x: point.x, y: point.y, width: 0, height: 0, fill: DEFAULT_FILL })
      }}
      onPointerMove={(event) => {
        const point = toCanvas(event)

        if (isPanning) {
          movePan({ x: event.clientX, y: event.clientY })
          return
        }

        if (drawStart.current && drawKind.current) {
          updateDraft({
            id: '__draft__',
            kind: drawKind.current,
            ...rectFromPoints(drawStart.current, point),
            fill: DEFAULT_FILL,
          })
          return
        }

        const active = drag.current
        if (active) {
          /* История сохраняется один раз — при первом сдвиге */
          if (!active.moved) {
            active.moved = true
            onBeginHistory()
          }
          onMoveShape(active.id, {
            x: active.origin.x + (point.x - active.pointer.x),
            y: active.origin.y + (point.y - active.pointer.y),
          })
        }
      }}
      onPointerUp={() => {
        const preview = draftRef.current
        if (drawStart.current && drawKind.current && preview) {
          if (preview.width >= MIN_SHAPE_SIZE && preview.height >= MIN_SHAPE_SIZE) {
            const id = onAddShape({
              kind: preview.kind,
              x: preview.x,
              y: preview.y,
              width: preview.width,
              height: preview.height,
              fill: preview.fill,
            })
            onSelect(id)
          }
        }
        drawStart.current = null
        drawKind.current = null
        updateDraft(null)
        drag.current = null
        endPan()
      }}
      onPointerCancel={() => {
        drawStart.current = null
        drawKind.current = null
        updateDraft(null)
        drag.current = null
        endPan()
      }}
    >
      {/* Слой фигур движется и масштабируется вместе с камерой */}
      <div
        className="absolute inset-0"
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          transformOrigin: '0 0',
        }}
      >
        <svg aria-hidden="true" className="h-full w-full overflow-visible">
          {shapes.map((shape) => (
            <Shape
              key={shape.id}
              shape={shape}
              selected={shape.id === selectedId}
              zoom={viewport.zoom}
            />
          ))}
          {draft && <Shape shape={draft} preview zoom={viewport.zoom} />}
        </svg>
      </div>
    </div>
  )
}
