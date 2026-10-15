import { useEffect } from 'react'

/** Карта горячих клавиш: «клавиша → действие». Поддерживаются модификаторы: mod+r, mod+shift+z */
type HotkeyMap = Record<string, (event: KeyboardEvent) => void>

function isEditableTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
  )
}

/** Собирает запись для карты: «модификатор+клавиша», например mod+shift+z */
function hotkeyName(event: KeyboardEvent): string[] {
  const parts: string[] = []
  if (event.ctrlKey || event.metaKey) parts.push('mod')
  if (event.shiftKey) parts.push('shift')
  if (event.altKey) parts.push('alt')
  parts.push(event.key.toLowerCase())
  return parts
}

/**
 * Слушает keydown и дергает обработчик из карты по имени клавиши.
 * Без модификаторов ищет точное имя (r, o, v);
 * с ctrl/meta — mod+z, mod+shift+z и т.д.
 */
export function useHotkeys(hotkeys: HotkeyMap): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      /* Пока вводим текст в поле (цвет, шрифт) — не мешаем */
      if (isEditableTarget(event.target)) return

      const parts = hotkeyName(event)
      /* С модификаторами это mod+z / mod+shift+z; без них — просто r, o, v */
      const handler =
        parts.length > 1 ? hotkeys[parts.join('+')] : hotkeys[parts[0]]
      if (!handler) return
      event.preventDefault()
      handler(event)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hotkeys])
}
