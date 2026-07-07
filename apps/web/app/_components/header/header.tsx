'use client'

import { useAuth } from "@/app/_context/AuthContext"
import { usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Search, LayoutGrid, Trophy, Settings as SettingsIcon, Bell, HelpCircle } from "lucide-react"
import styles from '@/app/_components/header/header.module.css'
import { PearlNavButton } from '@/app/_components/header/PearlNavButton'
import { useAchievements } from '@/app/_context/AchievementsContext'
import { useNotifications } from '@/app/_context/NotificationsContext'

const NAV_LINKS = [
    { href: '/analyze', label: 'Analyse', icon: Search },
    { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
    { href: '/achievements', label: 'Achievements', icon: Trophy },
    { href: '/settings', label: 'Settings', icon: SettingsIcon },
    { href: '/notifications', label: 'Notifications', icon: Bell },
    { href: '/faq', label: 'FAQs', icon: HelpCircle },
]

function UserArea({ name, role }: { name: string; role: string }) {
    const { equippedAchievement, hideAchievements } = useAchievements()
    const { signOut } = useAuth()
    const { unreadCount } = useNotifications()

    return (
        <div className={styles.userArea}>
            <Link href="/settings" className={styles.userIdentity}>
        <span className={styles.avatarFallback}>
          {name.charAt(0).toUpperCase()}
        </span>
                <span className={styles.userName}>{name}</span>
                <span className={styles.roleBadge}>{role}</span>
                {!hideAchievements && equippedAchievement && (
                    <span
                        className={styles.tagBadge}
                        style={{ background: equippedAchievement.color, color: equippedAchievement.text_color }}
                    >
            {equippedAchievement.name}
          </span>
                )}
                {unreadCount > 0 && (
                    <span className={styles.notificationBadge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
            </Link>
            <button
                className={styles.signOutBtn}
                onClick={() => signOut()}
                title="Sign out"
                aria-label="Sign out"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
            </button>
        </div>
    )
}

export default function Header() {
    const { user } = useAuth()
    const pathname = usePathname()
    const { hideAchievements } = useAchievements()
    const { unreadCount } = useNotifications()

    if (!user) return null

    return (
        <header className={styles.header}>
            <Link href="/" className={styles.brand}>
                <Image src="/cgi_logo.png" alt="CGI" height={30} width={64} style={{ objectFit: 'contain' }} />
            </Link>

            <nav aria-label="Navegação principal">
                <ul className={styles.pearlNav}>
                    {NAV_LINKS.filter(({ href }) => !(hideAchievements && href === '/achievements')).map(({ href, label, icon }) => {
                        const active = pathname.startsWith(href)
                        return (
                            <li key={href}>
                                <PearlNavButton
                                    href={href}
                                    label={label}
                                    icon={icon}
                                    active={active}
                                    badge={href === '/notifications' && unreadCount > 0 ? (
                                        <span className={styles.notificationBadge} style={{ position: 'absolute', top: -4, right: -4 }}>
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    ) : undefined}
                                />
                            </li>
                        )
                    })}
                </ul>
            </nav>

            <UserArea name={user.name} role={user.role} />
        </header>
    )
}