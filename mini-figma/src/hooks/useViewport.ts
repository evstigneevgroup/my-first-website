import { useCallback, useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { MAX_ZOOM, MIN_ZOOM } from '../constants/canvas'
import type { Point, Viewport } from '../types/shape'

/** Насколько остро реагирует зум на колесо: меньше — плавнее */
const WHEEL_SENSITIVITY = 0.0012

function clampZoom(zoom: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom))
}

/**
 * «Камера» холста. Логика без интерфейса:
 *  - панорамирование при зажатом пробеле + мыши,
 *  - зум колесом от 10 % до 400 % с привязкой к точке под курсором,
 *  - центрирование канваса при старте.
 */
export function useViewport(canvasRef: RefObject<HTMLElement | null>) {
  // Мир центрирован: точка мира (0, 0) при старте — в центре окна
  const [viewport, setViewport] = useState<Viewport>(() => ({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    zoom: 1,
  }))

  /** Пробел зажат — камера готова к сдвигу */
  const [isSpacePressed, setIsSpacePressed] = useState(false)
  /** Сдвиг сейчас идёт */
  const [isPanning, setIsPanning] = useState(false)

  /** Снимок камеры и точки старта на момент зажатия мыши */
  const panOrigin = useRef<{ screen: Point; viewport: Viewport } | null>(null)
  /** Актуальный viewport для обработчиков (без устаревших замыканий) */
  const viewportRef = useRef(viewport)
  viewportRef.current = viewport

  const panBy = useCallback((delta: Point): void => {
    setViewport((current) => ({
      ...current,
      x: current.x + delta.x,
      y: current.y + delta.y,
    }))
  }, [])

  const zoomAt = useCallback((screen: Point, deltaY: number): void => {
    setViewport((current) => {
      const zoom = clampZoom(current.zoom * Math.exp(-deltaY * WHEEL_SENSITIVITY))
      const scale = zoom / current.zoom

      /* Точка канваса под курсором должна остаться на месте:
         экранная позиция точки мира = мир × зум + сдвиг */
      return {
        zoom,
        x: screen.x + (current.x - screen.x) * scale,
        y: screen.y + (current.y - screen.y) * scale,
      }
    })
  }, [])

  /* Пробел: переводим камеру в режим сдвига и не даём странице прокрутиться */
  useEffect(() => {
    const isEditable = (target: EventTarget | null): boolean =>
      target instanceof HTMLElement &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable)

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.code !== 'Space' || event.repeat || isEditable(event.target)) return
      event.preventDefault()
      setIsSpacePressed(true)
    }
    const handleKeyUp = (event: KeyboardEvent): void => {
      if (event.code !== 'Space') return
      setIsSpacePressed(false)
    }
    /* Окно потеряло фокус (alt-tab) — сбрасываем пробел, чтобы камера не «залипла» */
    const handleBlur = (): void => setIsSpacePressed(false)

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', handleBlur)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', handleBlur)
    }
  }, [])

  /* Зум колесом с привязкой к точке под курсором.
     Слушатель вешаем вручную с passive: false — нужен preventDefault */
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleWheel = (event: WheelEvent): void => {
      event.preventDefault()
      zoomAt({ x: event.clientX, y: event.clientY }, event.deltaY)
    }
    canvas.addEventListener('wheel', handleWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', handleWheel)
  }, [canvasRef, zoomAt])

  /* Панорамирование: запоминаем точку старта и «снимок» камеры;
     дальше двигаем камеру ровно на разницу позиций мыши */
  const startPan = useCallback((screen: Point): void => {
    panOrigin.current = { screen, viewport: viewportRef.current }
    setIsPanning(true)
  }, [])

  const movePan = useCallback((screen: Point): void => {
    const origin = panOrigin.current
    if (!origin) return
    setViewport({
      ...origin.viewport,
      x: origin.viewport.x + (screen.x - origin.screen.x),
      y: origin.viewport.y + (screen.y - origin.screen.y),
    })
  }, [])

  const endPan = useCallback((): void => {
    panOrigin.current = null
    setIsPanning(false)
  }, [])

  return { viewport, isSpacePressed, isPanning, panBy, startPan, movePan, endPan, zoomAt }
}
