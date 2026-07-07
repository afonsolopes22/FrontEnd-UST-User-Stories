'use client'

import { useEffect, useState } from 'react'
import { animate } from 'framer-motion'

const TICKS = 24

function statusFor(value: number) {
    if (value >= 70) return { stroke: '#22c55e', text: '#15803d', label: 'High' }
    if (value >= 50) return { stroke: '#f59e0b', text: '#b45309', label: 'Medium' }
    return { stroke: '#ef4444', text: '#dc2626', label: 'Low' }
}

export function ScoreRing({ value, label }: { value: number; label: string }) {
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
    const status = statusFor(display)

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <div style={{ position: 'relative', width: 88, height: 88 }}>
                <div
                    style={{
                        position: 'absolute', inset: 6, borderRadius: '50%', filter: 'blur(12px)',
                        background: status.stroke, opacity: 0.18, transition: 'background 0.3s ease',
                    }}
                />
                <svg width="88" height="88" viewBox="0 0 88 88" style={{ position: 'relative' }}>
                    {Array.from({ length: TICKS }, (_, i) => {
                        const angle = (i / TICKS) * 360 - 90
                        const rad = (angle * Math.PI) / 180
                        const isMajor = i % 6 === 0
                        const rOuter = 43.5
                        const rInner = isMajor ? 40.5 : 42
                        return (
                            <line
                                key={i}
                                x1={44 + rOuter * Math.cos(rad)} y1={44 + rOuter * Math.sin(rad)}
                                x2={44 + rInner * Math.cos(rad)} y2={44 + rInner * Math.sin(rad)}
                                stroke="#9ca3af" strokeWidth={isMajor ? 1.1 : 0.6}
                                strokeLinecap="round" opacity={isMajor ? 0.35 : 0.18}
                            />
                        )
                    })}
                    <circle cx="44" cy="44" r={r} fill="none" stroke="#f0f0f0" strokeWidth="8" />
                    <circle
                        cx="44" cy="44" r={r} fill="none"
                        stroke={status.stroke} strokeWidth="8"
                        strokeDasharray={circ}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        transform="rotate(-90 44 44)"
                    />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '16px', fontWeight: 'bold', fontFamily: 'monospace', color: '#111' }}>
                        {Math.round(display)}%
                    </span>
                    <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: status.text }}>
                        {status.label}
                    </span>
                </div>
            </div>
            <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#888', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {label}
      </span>
        </div>
    )
}
