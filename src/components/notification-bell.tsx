"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Bell, X } from "lucide-react"

type Notification = {
  id: string
  title: string
  body: string
  is_read: boolean
  created_at: string
  metadata: { match_id?: string; challenge_id?: string; draft_session_id?: string } | null
}

type Props = {
  userId: string
  initialUnread: boolean
}

export function NotificationBell({ userId, initialUnread }: Props) {
  const [hasUnread, setHasUnread] = useState(initialUnread)
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const panelRef = useRef<HTMLDivElement>(null)

  // Poll every 10s for new unread notifications (when panel is closed)
  useEffect(() => {
    const interval = setInterval(async () => {
      if (open) return
      const supabase = createClient()
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_read", false)
      setHasUnread((count ?? 0) > 0)
    }, 10000)
    return () => clearInterval(interval)
  }, [userId, open])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  async function handleOpen() {
    if (open) { setOpen(false); return }
    setOpen(true)
    const supabase = createClient()

    // Fetch latest 20
    const { data } = await supabase
      .from("notifications")
      .select("id, title, body, is_read, created_at, metadata")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20)
    setNotifications((data ?? []) as Notification[])

    // Mark all read
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false)
    setHasUnread(false)
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return "just now"
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={handleOpen}
        className="relative flex items-center justify-center w-full h-full"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {hasUnread && (
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary" />
        )}
      </button>

      {open && (
        <div className="absolute bottom-full right-0 mb-2 w-80 max-h-[70dvh] overflow-y-auto rounded-xl border border-border bg-background shadow-xl z-50 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 sticky top-0 bg-background">
            <span className="text-sm font-semibold">Notifications</span>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No notifications yet</p>
          ) : (
            <div className="divide-y divide-border/20">
              {notifications.map((n) => {
                const matchId = n.metadata?.match_id
                const inner = (
                  <div className={`px-4 py-3 ${!n.is_read ? "bg-primary/5" : ""}`}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-snug">{n.title}</p>
                      <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">{timeAgo(n.created_at)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.body}</p>
                  </div>
                )
                return matchId ? (
                  <Link key={n.id} href={`/match/${matchId}/pick`} onClick={() => setOpen(false)} className="block hover:bg-secondary/50 transition-colors">
                    {inner}
                  </Link>
                ) : (
                  <div key={n.id}>{inner}</div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
