import { useCallback, useState } from 'react'
import { DEFAULT_FILL } from '../constants/canvas'
import type { Shape } from '../types/shape'

/** Данные новой фигуры: id генерируем внутри хука, fill берётся по умолчанию */
export type ShapeDraft = Omit<Shape, 'id' | 'fill'> & { fill?: string }

/** Сколько шагов истории храним */
const HISTORY_LIMIT = 100

function createShapeId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `shape-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

/** История: прошлое (для undo), текущее состояние, будущее (для redo) */
interface HistoryState {
  past: Shape[][]
  present: Shape[]
  future: Shape[][]
}

/**
 * Состояние фигур: список, добавление, изменение, выделение, история.
 * Логика данных без интерфейса — компоненты только вызывают эти функции.
 */
export function useShapes() {
  const [history, setHistory] = useState<HistoryState>({ past: [], present: [], future: [] })
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const shapes = history.present

  /** Запоминает текущее состояние в истории — вызывается один раз перед перетаскиванием */
  const beginHistory = useCallback((): void => {
    setHistory((current) => ({
      past: [...current.past, current.present].slice(-HISTORY_LIMIT),
      present: current.present,
      future: [],
    }))
  }, [])

  const addShape = useCallback((draft: ShapeDraft): string => {
    const shape: Shape = { ...draft, fill: draft.fill ?? DEFAULT_FILL, id: createShapeId() }
    setHistory((current) => ({
      past: [...current.past, current.present].slice(-HISTORY_LIMIT),
      present: [...current.present, shape],
      future: [],
    }))
    return shape.id
  }, [])

  const updateShape = useCallback(
    (id: string, patch: Partial<Omit<Shape, 'id'>>): void => {
      setHistory((current) => ({
        past: [...current.past, current.present].slice(-HISTORY_LIMIT),
        present: current.present.map((shape) => (shape.id === id ? { ...shape, ...patch } : shape)),
        future: [],
      }))
    },
    [],
  )

  /** Обновляет без записи в историю — используется во время перетаскивания */
  const moveShape = useCallback((id: string, patch: Partial<Omit<Shape, 'id'>>): void => {
    setHistory((current) => ({
      ...current,
      present: current.present.map((shape) => (shape.id === id ? { ...shape, ...patch } : shape)),
    }))
  }, [])

  const deleteShape = useCallback((id: string): void => {
    setHistory((current) => ({
      past: [...current.past, current.present].slice(-HISTORY_LIMIT),
      present: current.present.filter((shape) => shape.id !== id),
      future: [],
    }))
  }, [])

  const undo = useCallback((): void => {
    setHistory((current) => {
      const previous = current.past[current.past.length - 1]
      if (!previous) return current
      return { past: current.past.slice(0, -1), present: previous, future: [current.present, ...current.future] }
    })
  }, [])

  const redo = useCallback((): void => {
    setHistory((current) => {
      const next = current.future[0]
      if (!next) return current
      return {
        past: [...current.past, current.present].slice(-HISTORY_LIMIT),
        present: next,
        future: current.future.slice(1),
      }
    })
  }, [])

  return {
    shapes,
    selectedId,
    setSelectedId,
    addShape,
    updateShape,
    moveShape,
    deleteShape,
    beginHistory,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
  }
}
