import { useMemo, useState } from 'react'
import { Canvas } from './components/Canvas'
import { LayersPanel } from './components/LayersPanel'
import { PropertiesPanel } from './components/PropertiesPanel'
import { Toolbar } from './components/Toolbar'
import { useHotkeys } from './hooks/useHotkeys'
import { useShapes } from './hooks/useShapes'
import type { Tool } from './types/shape'

/**
 * Собирает зоны: холст занимает всё окно, панели лежат поверх.
 * Состояние инструментов и фигур живёт здесь и раздаётся по компонентам.
 */
export default function App() {
  const [tool, setTool] = useState<Tool>('select')
  const {
    shapes,
    selectedId,
    setSelectedId,
    addShape,
    updateShape,
    moveShape,
    beginHistory,
    undo,
    redo,
  } = useShapes()

  const selectedShape = shapes.find((shape) => shape.id === selectedId) ?? null

  /* Горячие клавиши: R/O/V — инструменты, Ctrl+Z и Ctrl+Shift+Z — история */
  const hotkeys = useMemo(
    () => ({
      r: () => setTool('rectangle'),
      o: () => setTool('ellipse'),
      v: () => setTool('select'),
      'mod+z': () => undo(),
      'mod+shift+z': () => redo(),
    }),
    [undo, redo],
  )
  useHotkeys(hotkeys)

  return (
    <main className="fixed inset-0">
      <Canvas
        tool={tool}
        shapes={shapes}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onAddShape={addShape}
        onMoveShape={moveShape}
        onBeginHistory={beginHistory}
      />

      <Toolbar activeTool={tool} onSelectTool={setTool} />

      <div className="absolute right-4 top-4 w-60">
        <PropertiesPanel
          shape={selectedShape}
          onChangeColor={(fill) => {
            if (selectedId) updateShape(selectedId, { fill })
          }}
        />
        <div className="mt-3">
          <LayersPanel shapes={shapes} selectedId={selectedId} onSelect={setSelectedId} />
        </div>
      </div>
    </main>
  )
}
