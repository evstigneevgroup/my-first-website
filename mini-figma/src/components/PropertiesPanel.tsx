import { SHAPE_COLORS, SHAPE_KIND_LABELS } from '../constants/canvas'
import type { Shape } from '../types/shape'

interface PropertiesPanelProps {
  /** Выделенная фигура или null */
  shape: Shape | null
  /** Смена цвета заливки выделенной фигуры */
  onChangeColor: (fill: string) => void
}

/** Панель свойств справа: геометрия и цвет выделенной фигуры */
export function PropertiesPanel({ shape, onChangeColor }: PropertiesPanelProps) {
  return (
    <aside className="rounded-2xl bg-white p-3 shadow-xl ring-1 ring-slate-200">
      <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        Свойства
      </h2>

      {!shape ? (
        <p className="text-xs leading-relaxed text-slate-400">
          Выберите фигуру — здесь появятся её свойства.
        </p>
      ) : (
        <>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs text-slate-600">
            <dt className="text-slate-400">Тип</dt>
            <dd>{SHAPE_KIND_LABELS[shape.kind]}</dd>
            <dt className="text-slate-400">X</dt>
            <dd className="tabular-nums">{Math.round(shape.x)}</dd>
            <dt className="text-slate-400">Y</dt>
            <dd className="tabular-nums">{Math.round(shape.y)}</dd>
            <dt className="text-slate-400">Ширина</dt>
            <dd className="tabular-nums">{Math.round(shape.width)}</dd>
            <dt className="text-slate-400">Высота</dt>
            <dd className="tabular-nums">{Math.round(shape.height)}</dd>
          </dl>

          <div className="mt-3 border-t border-slate-100 pt-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Цвет
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              {SHAPE_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  title={color}
                  aria-label={`Цвет ${color}`}
                  aria-pressed={shape.fill.toLowerCase() === color.toLowerCase()}
                  onClick={() => onChangeColor(color)}
                  style={{ backgroundColor: color }}
                  className={`h-6 w-6 rounded-md ring-1 transition-transform hover:scale-110 ${
                    shape.fill.toLowerCase() === color.toLowerCase()
                      ? 'ring-2 ring-blue-500'
                      : 'ring-slate-200'
                  }`}
                />
              ))}
              <label
                className="relative h-6 w-6 cursor-pointer overflow-hidden rounded-md ring-1 ring-slate-200"
                title="Свой цвет"
              >
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[10px] text-slate-500">
                  +
                </span>
                <input
                  type="color"
                  value={shape.fill}
                  onChange={(event) => onChangeColor(event.target.value)}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
              </label>
            </div>
          </div>
        </>
      )}
    </aside>
  )
}
