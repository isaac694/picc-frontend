'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type DevotionReadMoreProps = {
  content: string[] | string
  className?: string
}

export default function DevotionReadMore({ content, className }: DevotionReadMoreProps) {
  const [expanded, setExpanded] = React.useState(false)

  const paragraphs = Array.isArray(content) ? content : [content]

  return (
    <div className={cn('relative', className)}>
      <div
        className={cn(
          'space-y-4 text-foreground/80 leading-relaxed transition-[max-height] duration-300',
          !expanded && 'overflow-hidden max-h-[400px] sm:max-h-[480px] md:max-h-[550px]',
        )}
      >
        {paragraphs.map((line, index) => (
          <p key={`${line}-${index}`}>{line}</p>
        ))}
      </div>

      {!expanded && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent via-background/80 to-background" />
      )}

      <div className="mt-6">
        <Button
          type="button"
          variant="outline"
          className="rounded-full px-6"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? 'Read Less' : 'Read More'}
        </Button>
      </div>
    </div>
  )
}
