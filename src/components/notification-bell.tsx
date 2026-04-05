"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Bell } from "lucide-react"

type Props = {
  userId: string
  initialUnread: boolean
}

export function NotificationBell({ userId, initialUnread }: Props) {
  const supabase = createClient()
  const [hasUnread, setHasUnread] = useState(initialUnread)

  useEffect(() => {
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      }, () => setHasUnread(true))
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, supabase])

  return (
    <div className="relative">
      <Bell className="h-5 w-5" />
      {hasUnread && (
        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary" />
      )}
    </div>
  )
}
