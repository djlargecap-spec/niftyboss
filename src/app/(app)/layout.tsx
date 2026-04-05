import { NavBar } from "@/components/nav-bar"
import { InstallPrompt } from "@/components/install-prompt"
import { createClient, getAuthUser } from "@/lib/supabase/server"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getAuthUser()

  let isAdmin = false
  let initialUnread = false
  if (user) {
    const supabase = await createClient()
    const [{ data: profile }, { count }] = await Promise.all([
      supabase.from("profiles").select("is_admin").eq("id", user.id).single(),
      supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("is_read", false),
    ])
    isAdmin = profile?.is_admin ?? false
    initialUnread = (count ?? 0) > 0
  }

  return (
    <>
      <NavBar isAdmin={isAdmin} userId={user?.id ?? null} initialUnread={initialUnread} />
      <main className="min-h-dvh pb-16 pt-[env(safe-area-inset-top)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] md:pb-0 md:pl-56">
        {children}
      </main>
      <InstallPrompt />
    </>
  )
}
