import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: `${username}@neuroos.local`,
      password,
    })
    setLoading(false)
    if (error) {
      setError('Invalid credentials')
    } else {
      navigate('/', { replace: true })
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="bg-card border border-border rounded-card p-8 w-full max-w-sm">
        <h1 className="font-display text-2xl font-semibold text-foreground mb-6">NeuroOS</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-muted-foreground">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="bg-background border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
              autoComplete="username"
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-muted-foreground">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="bg-background border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
              autoComplete="current-password"
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="bg-primary text-primary-foreground rounded px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
