"use client"

import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { AlertCircle, Loader2 } from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"
import { Suspense, useState } from "react"

function CricketFieldLines() {
  return (
    <svg
      className="absolute inset-0 w-full h-full opacity-[0.035] pointer-events-none"
      viewBox="0 0 800 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {/* Outer boundary */}
      <ellipse cx="400" cy="450" rx="380" ry="420" fill="none" stroke="#EF4123" strokeWidth="1" />
      {/* 30-yard circle */}
      <ellipse cx="400" cy="450" rx="220" ry="240" fill="none" stroke="#EF4123" strokeWidth="1" />
      {/* Inner circle */}
      <ellipse cx="400" cy="450" rx="100" ry="110" fill="none" stroke="#D4A017" strokeWidth="1" />
      {/* Pitch rectangle */}
      <rect x="375" y="280" width="50" height="340" fill="none" stroke="#D4A017" strokeWidth="1" rx="4" />
      {/* Crease lines */}
      <line x1="360" y1="330" x2="440" y2="330" stroke="#D4A017" strokeWidth="1" />
      <line x1="360" y1="570" x2="440" y2="570" stroke="#D4A017" strokeWidth="1" />
      {/* Centre line */}
      <line x1="400" y1="30" x2="400" y2="870" stroke="#EF4123" strokeWidth="0.5" />
      <line x1="20" y1="450" x2="780" y2="450" stroke="#EF4123" strokeWidth="0.5" />
    </svg>
  )
}

function LoginForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const urlError = searchParams.get("error")

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(urlError ? "Authentication failed. Please try again." : null)
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    const supabase = createClient()

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) {
        setError(error.message)
      } else {
        setMessage("Check your email for a confirmation link.")
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        setError(error.message)
      } else {
        router.push("/dashboard")
        return
      }
    }

    setLoading(false)
  }

  return (
    <div className="relative min-h-dvh flex flex-col items-center justify-center overflow-hidden bg-[#060d18]">
      {/* Cricket field background */}
      <CricketFieldLines />

      {/* Ambient glow — orange top center */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      {/* Ambient glow — gold bottom right */}
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-accent/6 rounded-full blur-[100px] pointer-events-none" />

      {/* Top orange gradient bar */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary via-primary/80 to-accent" />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-sm px-6 gap-8">

        {/* Logo section */}
        <div className="flex flex-col items-center gap-5 text-center">
          {/* Logo with glow */}
          <div className="relative flex items-center justify-center">
            {/* Ambient glow behind logo */}
            <div className="absolute w-40 h-40 bg-primary/20 blur-3xl rounded-full" />
            <Image
              src="/icons/icon-192.png"
              alt="CricBoss"
              width={120}
              height={120}
              className="relative drop-shadow-[0_4px_24px_oklch(0.68_0.22_35/0.55)]"
              priority
            />
          </div>

          {/* Brand name */}
          <div>
            <h1 className="text-5xl font-black italic tracking-tight font-display leading-none">
              <span className="text-primary">Cric</span><span className="text-foreground">Boss</span>
            </h1>
            <div className="flex items-center justify-center gap-2 mt-3">
              <span className="h-px w-8 bg-gradient-to-r from-transparent to-primary/50" />
              <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
                Fantasy Cricket League
              </p>
              <span className="h-px w-8 bg-gradient-to-l from-transparent to-primary/50" />
            </div>
          </div>
        </div>

        {/* Login card */}
        <div className="w-full bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-6 space-y-4 shadow-[0_24px_64px_rgba(0,0,0,0.5)]">
          <div className="text-center space-y-0.5">
            <p className="text-sm font-semibold text-foreground">
              {isSignUp ? "Create Account" : "Welcome"}
            </p>
            <p className="text-xs text-muted-foreground">
              {isSignUp ? "Sign up to join the league" : "Sign in to pick your team"}
            </p>
          </div>

          {error && (
            <p className="text-sm text-center text-destructive flex items-center justify-center gap-1.5">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </p>
          )}

          {message && (
            <p className="text-sm text-center text-green-400">
              {message}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
            />
            <Button
              type="submit"
              disabled={loading}
              className="h-12 w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium rounded-xl shadow-md"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : isSignUp ? (
                "Sign Up"
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp)
              setError(null)
              setMessage(null)
            }}
            className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
          </button>
        </div>

        <p className="text-center text-[11px] text-muted-foreground/40 tracking-wide">
          INVITE ONLY
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
