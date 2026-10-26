'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'
type DevotionReadMoreProps = {
  content: string[] | string
  className?: string
}

export default function DevotionReadMore({ content, className }: DevotionReadMoreProps) {
  const source = Array.isArray(content) ? content.filter(Boolean).join('\n\n') : content
  const scrollClass =
    'group text-foreground/80 leading-relaxed max-h-[350px] sm:max-h-[430px] md:max-h-[500px] overflow-y-auto pr-2 scrollbar-hidden hover:scrollbar-visible'

  if (/<\/?[a-z][\s\S]*>/i.test(source)) {
    return (
      <div
        className={cn(
          scrollClass,
          '[&_p]:mb-3 [&_h1]:mb-2 [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold [&_strong]:font-semibold [&_em]:italic [&_u]:underline [&_s]:line-through [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1 [&_blockquote]:my-3 [&_blockquote]:border-l-2 [&_blockquote]:border-foreground/20 [&_blockquote]:pl-3 [&_a]:text-primary [&_a]:underline [&_.ql-align-center]:text-center [&_.ql-align-right]:text-right [&_.ql-align-justify]:text-justify [&_.ql-indent-1]:pl-8 [&_.ql-indent-2]:pl-16 [&_.ql-indent-3]:pl-24',
          className,
        )}
        dangerouslySetInnerHTML={{ __html: source }}
      />
    )
  }

  const paragraphs = Array.isArray(content) ? content : [content]

  return (
    <div className={cn(scrollClass, 'space-y-4', className)}>
        {paragraphs.map((line, index) => (
          <p key={`${line}-${index}`}>{line}</p>
        ))}
    </div>
  )
}
