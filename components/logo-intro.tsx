'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

const brandMark = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/JK-ffYCn9gcm0msoGpOKk1Rrmf3uB6iMr.png'

// Plays only on the first entrance of a session, then never repeats.
export function LogoIntro() {
  const [phase, setPhase] = useState<'idle' | 'playing' | 'done'>('idle')

  useEffect(() => {
    const alreadyPlayed = window.sessionStorage.getItem('jk-intro-played')
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // Skip path keeps the null-rendering idle state — nothing to update.
    if (alreadyPlayed || reduceMotion) return

    window.sessionStorage.setItem('jk-intro-played', '1')
    let timer = 0
    const raf = requestAnimationFrame(() => {
      document.body.style.overflow = 'hidden'
      setPhase('playing')
      timer = window.setTimeout(() => {
        setPhase('done')
        document.body.style.overflow = ''
      }, 2200)
    })
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(timer)
      document.body.style.overflow = ''
    }
  }, [])

  if (phase !== 'playing') return null

  return (
    <div className="logo-intro" aria-hidden="true">
      <div className="logo-intro-mark">
        <Image src={brandMark} alt="" width={640} height={640} priority className="w-[min(46vw,20rem)] object-contain" />
        <span className="logo-intro-sheen" />
      </div>
    </div>
  )
}
