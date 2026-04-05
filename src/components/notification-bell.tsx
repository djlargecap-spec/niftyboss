"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Bell } from "lucide-react"

type Props = {
  userId: string
  initialUnread: boolean
}

export function NotificationBell({ userId, initialUnread }: Props) {
  const [hasUnread, setHasUnread] = useState(initialUnread)

  // Poll every 10s for new unread notifications
  useEffect(() => {
    const interval = setInterval(async () => {
      const supabase = createClient()
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_read", false)
      setHasUnread((count ?? 0) > 0)
    }, 10000)

    return () => clearInterval(interval)
  }, [userId])

  return (
    <div className="relative">
      <Bell className="h-5 w-5" />
      {hasUnread && (
        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary" />
      )}
    </div>
  )
}
