'use client'

import { useEffect, useState } from 'react'
import { animate } from 'framer-motion'

export function ScoreRing({ value, label, color }: { value: number; label: string; color: string }) {
    const r = 36
    const circ = 2 * Math.PI * r
    const [display, setDisplay] = useState(0)

    useEffect(() => {
        const controls = animate(0, value, {
            duration: 1,
            ease: 'easeOut',
            onUpdate: setDisplay,
        })
        return () => controls.stop()
    }, [value])

    const offset = circ * (1 - display / 100)

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <svg width="88" height="88" viewBox="0 0 88 88">
                <circle cx="44" cy="44" r={r} fill="none" stroke="#f0f0f0" strokeWidth="8" />
                <circle
                    cx="44" cy="44" r={r} fill="none"
                    stroke={color} strokeWidth="8"
                    strokeDasharray={circ}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    transform="rotate(-90 44 44)"
                />
                <text x="44" y="44" textAnchor="middle" dominantBaseline="central"
                      style={{ fontSize: '16px', fontWeight: 'bold', fontFamily: 'monospace', fill: '#111' }}>
                    {Math.round(display)}%
                </text>
            </svg>
            <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#888', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {label}
      </span>
        </div>
    )
}
