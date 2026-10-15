import type { ReactElement } from 'react'
import { TOOLS } from '../constants/tools'
import type { Tool } from '../types/shape'

interface ToolbarProps {
  activeTool: Tool
  onSelectTool: (tool: Tool) => void
}

/** Иконки inline-SVG: ради трёх картинок не тянем зависимость */
function ToolIcon({ tool }: { tool: Tool }) {
  const icons: Record<Tool, ReactElement> = {
    select: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
      </svg>
    ),
    rectangle: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="2" />
      </svg>
    ),
    ellipse: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
      </svg>
    ),
  }
  return icons[tool]
}

/** Панель инструментов слева. Каркас: кнопки переключают активный инструмент,
    подсветка и подсказки клавиш уже работают */
export function Toolbar({ activeTool, onSelectTool }: ToolbarProps) {
  return (
    <aside className="absolute left-4 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-1 rounded-2xl bg-white p-2 shadow-xl ring-1 ring-slate-200">
      {TOOLS.map(({ id, label, key }) => (
        <button
          key={id}
          type="button"
          title={`${label} (${key.toUpperCase()})`}
          aria-pressed={activeTool === id}
          onClick={() => onSelectTool(id)}
          className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
            activeTool === id
              ? 'bg-blue-500 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <ToolIcon tool={id} />
        </button>
      ))}
    </aside>
  )
}
