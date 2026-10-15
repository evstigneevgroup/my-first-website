import { SHAPE_KIND_LABELS } from '../constants/canvas'
import type { Shape, ShapeKind } from '../types/shape'

interface LayersPanelProps {
  shapes: Shape[]
  selectedId: string | null
  onSelect: (id: string | null) => void
}

/** Слои: новые фигуры сверху, как в Figma; клик выделяет, повторный — снимает */
export function LayersPanel({ shapes, selectedId, onSelect }: LayersPanelProps) {
  /* Нумеруем каждый вид отдельно: «Прямоугольник 1», «Эллипс 2», … */
  const counters: Record<ShapeKind, number> = { rectangle: 0, ellipse: 0 }
  const layers = [...shapes].reverse().map((shape) => {
    counters[shape.kind] += 1
    return {
      id: shape.id,
      kind: shape.kind,
      title: `${SHAPE_KIND_LABELS[shape.kind]} ${counters[shape.kind]}`,
    }
  })

  return (
    <aside className="rounded-2xl bg-white p-3 shadow-xl ring-1 ring-slate-200">
      <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        Слои
      </h2>

      {layers.length === 0 ? (
        <p className="text-xs leading-relaxed text-slate-400">
          Пока нет фигур — они появятся после рисования на следующих шагах.
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {layers.map((layer) => {
            const isSelected = layer.id === selectedId
            return (
              <li key={layer.id}>
                <button
                  type="button"
                  onClick={() => onSelect(isSelected ? null : layer.id)}
                  className={`w-full rounded-lg px-2 py-1.5 text-left text-xs transition-colors ${
                    isSelected
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {layer.title}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </aside>
  )
}
