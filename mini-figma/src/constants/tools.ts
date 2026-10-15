import type { Tool } from '../types/shape'

/** Описание инструмента: для панели инструментов и горячих клавиш */
export interface ToolDefinition {
  /** Идентификатор из типа Tool */
  id: Tool
  /** Подпись для подсказки */
  label: string
  /** Быстрая клавиша */
  key: string
}

/** Список инструментов с привязкой к клавишам. */
export const TOOLS: ToolDefinition[] = [
  { id: 'select', label: 'Выбор', key: 'v' },
  { id: 'rectangle', label: 'Прямоугольник', key: 'r' },
  { id: 'ellipse', label: 'Эллипс', key: 'o' },
]

/** Соответствие «клавиша → инструмент» — пригодится useHotkeys на следующих шагах */
export const TOOL_BY_KEY: Record<string, Tool> = Object.fromEntries(
  TOOLS.map((tool) => [tool.key, tool.id]),
)
