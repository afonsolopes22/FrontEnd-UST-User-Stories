'use client'

import { motion, type Variants } from 'framer-motion'

const VARIANT_STYLES = {
    pass: { bg: '#f0fdf4', border: '#bbf7d0', accent: '#15803d', text: '#166534', glow: 'rgba(21,128,61,0.18)' },
    fail: { bg: '#fff7ed', border: '#fed7aa', accent: '#c2410c', text: '#9a3412', glow: 'rgba(194,65,12,0.18)' },
    improvements: { bg: '#ede9f8', border: '#cbc3e6', accent: '#5236ab', text: '#200a58', glow: 'rgba(82,54,171,0.18)' },
    bestPractices: { bg: '#eff8ff', border: '#bae3fd', accent: '#0369a1', text: '#0c4a6e', glow: 'rgba(3,105,161,0.18)' },
} as const

type EvaluationVariant = keyof typeof VARIANT_STYLES

const cardVariants: Variants = {
    hidden: { opacity: 0, y: 16, scale: 0.97 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: 'easeOut' } },
}

const listVariants: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
}

const itemVariants: Variants = {
    hidden: { opacity: 0, x: -14 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' } },
}

export function EvaluationCard({
    variant, icon, title, items, emptyLabel = '—',
}: {
    variant: EvaluationVariant
    icon: string
    title: string
    items: string[]
    emptyLabel?: string
}) {
    const c = VARIANT_STYLES[variant]

    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={cardVariants}
            style={{ position: 'relative' }}
        >
            <motion.div initial="rest" whileHover="hover" animate="rest" style={{ position: 'relative' }}>
                {/* Soft glow — off by default, fades in on hover. Kept subtle on purpose. */}
                <motion.div
                    variants={{ rest: { opacity: 0 }, hover: { opacity: 0.3 } }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    style={{
                        position: 'absolute', inset: -6, borderRadius: 14,
                        background: c.accent, filter: 'blur(14px)', zIndex: 0, pointerEvents: 'none',
                    }}
                />

                <motion.div
                    variants={{ rest: { y: 0 }, hover: { y: -2 } }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    style={{
                        position: 'relative',
                        zIndex: 1,
                        background: c.bg,
                        border: `1px solid ${c.border}`,
                        borderRadius: 10,
                        padding: '1rem',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '0.75rem', fontSize: 16 }}>
                        <span style={{ color: c.accent }}>{icon}</span>
                        <span style={{ fontSize: 11, fontWeight: 'bold', letterSpacing: '0.06em', color: c.accent }}>
                            {title}
                        </span>
                    </div>

                    {items.length === 0 ? (
                        <p style={{ fontSize: 12, color: '#888', margin: 0 }}>{emptyLabel}</p>
                    ) : (
                        <motion.ul
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, amount: 0.3 }}
                            variants={listVariants}
                            style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}
                        >
                            {items.map((text, i) => (
                                <motion.li
                                    key={i}
                                    variants={itemVariants}
                                    style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, lineHeight: 1.6, color: c.text }}
                                >
                                    <span
                                        style={{
                                            width: 15, height: 15, borderRadius: 4, background: c.accent, flexShrink: 0,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2,
                                            color: '#fff', fontSize: 9, lineHeight: 1,
                                        }}
                                    >
                                        {icon}
                                    </span>
                                    <span>{text}</span>
                                </motion.li>
                            ))}
                        </motion.ul>
                    )}
                </motion.div>
            </motion.div>
        </motion.div>
    )
}
