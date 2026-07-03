'use client'

import { useAuth } from "@/app/_context/AuthContext"
import { usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import styles from '@/app/_components/header/header.module.css'
import { useAchievements } from '@/app/_context/AchievementsContext'
import { useNotifications } from '@/app/_context/NotificationsContext'
import { ACHIEVEMENTS } from '@/lib/achievements'

const NAV_LINKS = [
  { href: '/analyze', label: 'Analyse' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/achievements', label: 'Achievements' },
  { href: '/settings', label: 'Settings' },
  { href: '/notifications', label: 'Notifications' },
  { href: '/faq', label: 'FAQs' },
]

function UserArea({ name, role }: { name: string; role: string }) {
  const { activeTag, hideAchievements } = useAchievements()
  const { signOut } = useAuth()
  const { unreadCount } = useNotifications()
  const achievement = ACHIEVEMENTS.find(a => a.id === activeTag && a.id !== 'NEWBIE') ?? null

  return (
    <div className={styles.userArea}>
      <Link href="/settings" className={styles.userIdentity}>
        <span className={styles.avatarFallback}>
          {name.charAt(0).toUpperCase()}
        </span>
        <span className={styles.userName}>{name}</span>
        <span className={styles.roleBadge}>{role}</span>
        {!hideAchievements && achievement && (
          <span
            className={styles.tagBadge}
            style={{ background: achievement.color, color: achievement.textColor }}
          >
            {achievement.name}
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
        <ul className={styles.navlist}>
          {NAV_LINKS.filter(({ href }) => !(hideAchievements && href === '/achievements')).map(({ href, label }) => {
            const active = pathname.startsWith(href)
            return (
              <li key={href}>
                <Link href={href} className={`${styles.navlink} ${active ? styles.active : ''}`}>
                  {label}
                  {href === '/notifications' && unreadCount > 0 && (
                    <span className={styles.notificationBadge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <UserArea name={user.name} role={user.role} />
    </header>
  )
}