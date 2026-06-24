import { localDateStr } from '../../lib/utils'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Phone, Mail, RefreshCw, Users, Trophy, FileText,
  ArrowRight, Target, Minus, Plus, CheckCircle2,
} from 'lucide-react'
import {
  useCmLeads,
  useCmNiches,
  useCmAllCampaignContactsCount,
} from '../../hooks/useChubsMedia'

const TODAY = localDateStr()
const GOAL_TARGET_KEY = 'chubs_lead_goal_target'
const GOAL_COUNT_KEY = `chubs_lead_goal_count_${TODAY}`

function useDailyGoal() {
  const [target, setTargetState] = useState<number>(() =>
    Number(localStorage.getItem(GOAL_TARGET_KEY) ?? 20),
  )
  const [count, setCountState] = useState<number>(() =>
    Number(localStorage.getItem(GOAL_COUNT_KEY) ?? 0),
  )

  function setTarget(v: number) {
    const n = Math.max(1, v)
    localStorage.setItem(GOAL_TARGET_KEY, String(n))
    setTargetState(n)
  }
  function setCount(v: number) {
    const n = Math.max(0, v)
    localStorage.setItem(GOAL_COUNT_KEY, String(n))
    setCountState(n)
  }

  return { target, count, setTarget, setCount }
}

const NICHE_BAR_COLORS = [
  'bg-rose-400', 'bg-green-400', 'bg-blue-400',
  'bg-indigo-400', 'bg-amber-400', 'bg-purple-400',
  'bg-pink-400', 'bg-cyan-400',
]
const NICHE_ICON_COLORS = [
  'bg-rose-100 text-rose-500', 'bg-green-100 text-green-600',
  'bg-blue-100 text-blue-600', 'bg-indigo-100 text-indigo-600',
  'bg-amber-100 text-amber-600', 'bg-purple-100 text-purple-600',
  'bg-pink-100 text-pink-600', 'bg-cyan-100 text-cyan-600',
]

function fmt(dateStr: string | null) {
  if (!dateStr) return null
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

const QUICK_LINKS = [
  {
    icon: Mail,
    label: 'Email Outreach',
    desc: 'Send bulk emails and track responses.',
    action: 'Open Email Tracker',
    to: '/chubs/client-acquisition/email',
    color: 'bg-rose-100 text-rose-500',
  },
  {
    icon: RefreshCw,
    label: 'Follow Ups',
    desc: 'View and manage all pending follow-ups.',
    action: 'View Follow Ups',
    to: '/chubs/client-acquisition/follow-ups',
    color: 'bg-amber-100 text-amber-600',
  },
  {
    icon: Users,
    label: 'Interested Leads',
    desc: 'Leads who showed interest in your offerings.',
    action: 'View Interested Leads',
    to: '/chubs/client-acquisition/leads?status=interested',
    color: 'bg-green-100 text-green-600',
  },
  {
    icon: Trophy,
    label: 'Converted Clients',
    desc: 'Leads that are converted into clients.',
    action: 'View Converted',
    to: '/chubs/client-acquisition/leads?status=converted',
    color: 'bg-emerald-100 text-emerald-700',
  },
  {
    icon: FileText,
    label: 'Call Scripts & Templates',
    desc: 'Access call scripts and WhatsApp templates.',
    action: 'View Templates',
    to: '/chubs/client-acquisition/scripts',
    color: 'bg-purple-100 text-purple-600',
  },
]

export default function ChubsClientAcquisition() {
  const { data: leads = [] } = useCmLeads()
  const { data: niches = [] } = useCmNiches()
  const { data: emailCount = 0 } = useCmAllCampaignContactsCount()
  const { target, count, setTarget, setCount } = useDailyGoal()
  const [editingTarget, setEditingTarget] = useState(false)
  const [targetInput, setTargetInput] = useState('')
  const goalMet = count >= target
  const goalPct = Math.min(100, Math.round((count / target) * 100))

  const stats = useMemo(() => {
    const today = localDateStr()
    const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const total = leads.length
    const followUpsDue = leads.filter(
      l => l.next_follow_up && l.next_follow_up >= today && l.next_follow_up <= in7Days,
    ).length
    const converted = leads.filter(l => l.follow_up_status === 'converted').length
    const convRate = total > 0 ? ((converted / total) * 100).toFixed(1) : '0.0'
    return { total, followUpsDue, convRate }
  }, [leads])

  const nicheStats = useMemo(() => {
    const maxCount = Math.max(1, ...niches.map(n => leads.filter(l => l.niche_id === n.niche_id).length))
    return niches.map(n => {
      const nicheLeads = leads.filter(l => l.niche_id === n.niche_id)
      const lastContact = nicheLeads
        .map(l => l.last_contact)
        .filter(Boolean)
        .sort()
        .at(-1) ?? null
      return { ...n, count: nicheLeads.length, lastContact, pct: Math.round((nicheLeads.length / maxCount) * 100) }
    })
  }, [niches, leads])

  return (
    <div className="min-h-screen bg-cream">
      {/* Hero header */}
      <div className="bg-card border-b border-border px-8 pt-6 pb-8 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
              <Target size={20} className="text-rose-500" />
            </div>
            <h1 className="font-display text-[28px] font-bold text-text-dark">Client Acquisition</h1>
          </div>
          <p className="text-text-mid text-sm ml-[52px]">Find. Connect. Convert. Build long-term client relationships.</p>
        </div>
        {/* Decorative blobs */}
        <div className="absolute right-12 top-4 w-32 h-32 bg-rose-50 rounded-full opacity-60 blur-2xl pointer-events-none" />
        <div className="absolute right-32 top-8 w-20 h-20 bg-amber-50 rounded-full opacity-80 blur-xl pointer-events-none" />
      </div>

      <div className="px-8 py-6 space-y-8">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: Phone, iconCls: 'bg-rose-100 text-rose-500',
              label: 'Total Leads', val: stats.total, sub: 'All time',
            },
            {
              icon: Mail, iconCls: 'bg-blue-100 text-blue-500',
              label: 'Emails Sent', val: emailCount, sub: 'Across all campaigns',
            },
            {
              icon: RefreshCw, iconCls: 'bg-amber-100 text-amber-600',
              label: 'Follow Ups Due', val: stats.followUpsDue, sub: 'Next 7 days',
            },
            {
              icon: Trophy, iconCls: 'bg-emerald-100 text-emerald-600',
              label: 'Conversion Rate', val: `${stats.convRate}%`, sub: 'Converted leads',
            },
          ].map(s => (
            <div key={s.label} className="bg-card rounded-card border border-border px-5 py-5 flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.iconCls}`}>
                <s.icon size={18} />
              </div>
              <div>
                <p className="text-[11px] text-text-light mb-1">{s.label}</p>
                <p className="font-display text-[28px] font-bold text-text-dark leading-none">{s.val}</p>
                <p className="text-[11px] text-text-light mt-1">{s.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Daily Lead Call Goal */}
        <div className="bg-card rounded-card border border-border px-6 py-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Left: counter */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${goalMet ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                  {goalMet
                    ? <CheckCircle2 size={20} className="text-emerald-600" />
                    : <Phone size={20} className="text-rose-500" />}
                </div>
                <div>
                  <p className="text-[11px] text-text-light">Today's Calls</p>
                  <p className={`font-display text-[26px] font-bold leading-none ${goalMet ? 'text-emerald-600' : 'text-text-dark'}`}>
                    {count}
                    <span className="text-[14px] text-text-light font-normal"> / {target}</span>
                  </p>
                </div>
              </div>

              {/* +/- buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCount(count - 1)}
                  disabled={count === 0}
                  className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-text-mid hover:bg-rose-bg hover:text-rose transition-colors disabled:opacity-30"
                >
                  <Minus size={14} />
                </button>
                <button
                  onClick={() => setCount(count + 1)}
                  className="w-8 h-8 rounded-lg border border-rose/30 bg-rose-bg/40 flex items-center justify-center text-rose hover:bg-rose-bg transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Right: progress bar + target edit */}
            <div className="flex-1 min-w-[180px] max-w-sm">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] text-text-light">Daily Goal Progress</span>
                {editingTarget ? (
                  <form
                    onSubmit={e => {
                      e.preventDefault()
                      const n = parseInt(targetInput)
                      if (!isNaN(n) && n > 0) setTarget(n)
                      setEditingTarget(false)
                    }}
                    className="flex items-center gap-1"
                  >
                    <input
                      autoFocus
                      value={targetInput}
                      onChange={e => setTargetInput(e.target.value)}
                      onBlur={() => setEditingTarget(false)}
                      className="w-14 text-[11px] border border-rose rounded px-1.5 py-0.5 outline-none text-text-dark"
                      type="number"
                      min={1}
                    />
                  </form>
                ) : (
                  <button
                    onClick={() => { setTargetInput(String(target)); setEditingTarget(true) }}
                    className="text-[11px] text-rose hover:underline"
                  >
                    Goal: {target} calls
                  </button>
                )}
              </div>
              <div className="h-2 bg-border rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${goalMet ? 'bg-emerald-400' : 'bg-rose'}`}
                  style={{ width: `${goalPct}%` }}
                />
              </div>
              <p className="text-[10px] text-text-light mt-1">
                {goalMet
                  ? `Goal met! ${count - target} extra calls`
                  : `${target - count} more to reach today's goal`}
              </p>
            </div>
          </div>
        </div>

        {/* Cold Calling by Niche */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div>
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-rose-500" />
                <h2 className="font-display text-[17px] font-bold text-text-dark">1. Cold Calling by Niche</h2>
              </div>
              <p className="text-text-mid text-xs mt-0.5 ml-6">Manage leads and calls for each niche.</p>
            </div>
            <Link
              to="/chubs/client-acquisition/niches"
              className="flex items-center gap-1 text-xs text-rose hover:underline font-medium"
            >
              Manage Niches <ArrowRight size={12} />
            </Link>
          </div>

          {niches.length === 0 ? (
            <div className="bg-card rounded-card border border-border px-6 py-10 text-center mt-4">
              <p className="text-text-light text-sm">No niches yet.</p>
              <Link to="/chubs/client-acquisition/email" className="text-xs text-rose hover:underline mt-2 inline-block">
                Go to Email Outreach to add niches →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 mt-4">
              {nicheStats.map((n, i) => (
                <div key={n.niche_id} className="bg-card rounded-card border border-border p-4 flex flex-col gap-2">
                  {/* Icon */}
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold ${NICHE_ICON_COLORS[i % NICHE_ICON_COLORS.length]}`}>
                    {n.name.charAt(0).toUpperCase()}
                  </div>
                  {/* Name + count */}
                  <div>
                    <p className="text-[13px] font-semibold text-text-dark leading-snug">{n.name}</p>
                    <p className="text-[11px] text-text-light">{n.count} Leads</p>
                  </div>
                  {/* Bar */}
                  <div className="h-1 bg-border rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${NICHE_BAR_COLORS[i % NICHE_BAR_COLORS.length]}`}
                      style={{ width: `${n.pct}%` }}
                    />
                  </div>
                  {/* Last contact */}
                  <p className="text-[10px] text-text-light">
                    {n.lastContact ? `Last call: ${fmt(n.lastContact)}` : 'No calls yet'}
                  </p>
                  {/* CTA */}
                  <Link
                    to={`/chubs/client-acquisition/leads?niche_id=${n.niche_id}`}
                    className="mt-auto flex items-center gap-1 text-[11px] font-semibold text-rose hover:underline"
                  >
                    View Leads <ArrowRight size={11} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div>
          <h2 className="font-display text-[17px] font-bold text-text-dark mb-4">Quick Access</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {QUICK_LINKS.map(q => (
              <div key={q.label} className="bg-card rounded-card border border-border p-5 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${q.color}`}>
                    <q.icon size={18} />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-text-dark">{q.label}</p>
                    <p className="text-xs text-text-mid mt-0.5 leading-relaxed">{q.desc}</p>
                  </div>
                </div>
                <Link
                  to={q.to}
                  className="flex items-center gap-1 text-[12px] font-semibold text-rose hover:underline mt-auto"
                >
                  {q.action} <ArrowRight size={12} />
                </Link>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
