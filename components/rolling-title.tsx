'use client'

import { useEffect, useState } from 'react'

type Segment = { text: string; className?: string }

type Char = { ch: string; className?: string }
type Word = { type: 'word'; chars: Char[] } | { type: 'space' }

function buildWords(segments: Segment[]): { words: Word[]; visibleCount: number } {
  const chars: Char[] = []
  for (const segment of segments) {
    for (const ch of segment.text) chars.push({ ch, className: segment.className })
  }

  const words: Word[] = []
  let current: Char[] = []
  let visibleCount = 0

  const flush = () => {
    if (current.length) {
      words.push({ type: 'word', chars: current })
      current = []
    }
  }

  for (const c of chars) {
    if (c.ch === ' ') {
      flush()
      words.push({ type: 'space' })
    } else {
      current.push(c)
      visibleCount++
    }
  }
  flush()

  return { words, visibleCount }
}

type RollingTitleProps = {
  segments: Segment[]
  className?: string
  id?: string
  /** Segundos entre o início de cada letra a partir do centro. */
  step?: number
}

export function RollingTitle({ segments, className, id, step = 0.045 }: RollingTitleProps) {
  const [play, setPlay] = useState(false)
  const { words, visibleCount } = buildWords(segments)

  useEffect(() => {
    const raf = requestAnimationFrame(() => setPlay(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  const center = (visibleCount - 1) / 2
  let visibleIndex = 0

  return (
    <h1 id={id} className={`rolling-title ${className ?? ''}`} data-play={play}>
      <span className="sr-only">{segments.map((s) => s.text).join('')}</span>
      <span aria-hidden="true">
        {words.map((word, wi) => {
          if (word.type === 'space') return ' '
          return (
            <span key={wi} className="roll-word">
              {word.chars.map((c, ci) => {
                const delay = Math.abs(visibleIndex - center) * step
                visibleIndex++
                return (
                  <span key={ci} className="roll-line">
                    <span className={`roll-inner ${c.className ?? ''}`} style={{ animationDelay: `${delay}s` }}>
                      {c.ch}
                    </span>
                  </span>
                )
              })}
            </span>
          )
        })}
      </span>
    </h1>
  )
}
