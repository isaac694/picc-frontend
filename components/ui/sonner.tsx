'use client'

import { Toaster as Sonner, ToasterProps } from 'sonner'
import { useEffect, useState } from 'react'

function readThemeFromHtml(): ToasterProps['theme'] {
  if (typeof document === 'undefined') return 'light'
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

const Toaster = ({ ...props }: ToasterProps) => {
  const [theme, setTheme] = useState<ToasterProps['theme']>(() => readThemeFromHtml())

  useEffect(() => {
    const update = () => setTheme(readThemeFromHtml())

    update()
    window.addEventListener('admin-theme-change', update as EventListener)

    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    return () => {
      window.removeEventListener('admin-theme-change', update as EventListener)
      observer.disconnect()
    }
  }, [])

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
