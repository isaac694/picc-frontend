'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'
type DevotionReadMoreProps = {
  content: string[] | string
  className?: string
}

export default function DevotionReadMore({ content, className }: DevotionReadMoreProps) {
  const paragraphs = Array.isArray(content) ? content : [content]

  return (
    <div
      className={cn(
        'group space-y-4 text-foreground/80 leading-relaxed max-h-[350px] sm:max-h-[430px] md:max-h-[500px] overflow-y-auto pr-2 scrollbar-hidden hover:scrollbar-visible',
        className,
      )}
    >
        {paragraphs.map((line, index) => (
          <p key={`${line}-${index}`}>{line}</p>
        ))}
    </div>
  )
}
