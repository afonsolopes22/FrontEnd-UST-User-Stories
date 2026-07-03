"use client";

import { AuthProvider } from "@/app/_context/AuthContext";
import { AchievementsProvider } from "@/app/_context/AchievementsContext";
import { NotificationsProvider } from "@/app/_context/NotificationsContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <NotificationsProvider>
        <AchievementsProvider>
          {children}
        </AchievementsProvider>
      </NotificationsProvider>
    </AuthProvider>
  );
}