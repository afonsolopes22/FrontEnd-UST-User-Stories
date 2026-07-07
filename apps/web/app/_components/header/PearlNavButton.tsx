'use client'

import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import styles from './header.module.css'

const VARIANTS: Record<string, { accent: string; text: string }> = {
    '/analyze': { accent: '64,180,255', text: '129,216,255' },
    '/dashboard': { accent: '168,85,247', text: '216,180,254' },
    '/achievements': { accent: '250,204,21', text: '253,230,138' },
    '/settings': { accent: '148,163,184', text: '226,232,240' },
    '/notifications': { accent: '239,68,68', text: '254,202,202' },
    '/faq': { accent: '52,211,153', text: '167,243,208' },
}

export function PearlNavButton({
    href,
    label,
    icon: Icon,
    active,
    badge,
}: {
    href: string
    label: string
    icon: LucideIcon
    active: boolean
    badge?: ReactNode
}) {
    const variant = VARIANTS[href] ?? VARIANTS['/dashboard']

    return (
        <Link
            href={href}
            className={`${styles.pearlButton} ${active ? styles.active : ''}`}
            style={{ '--accent-rgb': variant.accent, '--text-rgb': variant.text } as CSSProperties}
        >
            <span className={styles.wrap}>
                <Icon />
                {label}
            </span>
            {badge}
        </Link>
    )
}
