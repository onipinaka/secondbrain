import { useMemo } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Label,
} from 'recharts'
import { useCsTopics, useCsQuestions } from '../../../hooks/useCoreSubject'

type Props = { coreSubjectId: number }

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function computeStreak(dates: Set<string>): number {
  let count = 0
  for (let i = 0; i < 365; i++) {
    const d = new Date(); d.setDate(d.getDate() - i)
    if (dates.has(toDateStr(d))) count++
    else if (i > 0) break
  }
  return count
}

export default function AnalyticsTab({ coreSubjectId }: Props) {
  const { data: topics = [] } = useCsTopics(coreSubjectId)
  const { data: questions = [] } = useCsQuestions(coreSubjectId)

  const solved = useMemo(() => questions.filter(q => q.status === 'solved'), [questions])
  const attempted = useMemo(() => questions.filter(q => q.status === 'attempted'), [questions])

  const streak = useMemo(() => {
    const dates = new Set(solved.map(q => q.updated_at?.split('T')[0]).filter(Boolean) as string[])
    return computeStreak(dates)
  }, [solved])

  const avgTime = useMemo(() => {
    const timed = solved.filter(q => q.timer)
    return timed.length > 0 ? Math.round(timed.reduce((s, q) => s + (q.timer ?? 0), 0) / timed.length) : 0
  }, [solved])

  const acceptanceRate = useMemo(() => {
    if (!questions.length) return 0
    return Math.round((solved.length / questions.length) * 100)
  }, [solved, questions])

  const trendData = useMemo(() => {
    const counts = new Map<string, number>()
    solved.forEach(q => {
      const d = q.updated_at?.split('T')[0]
      if (d) counts.set(d, (counts.get(d) ?? 0) + 1)
    })
    const result = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const ds = toDateStr(d)
      result.push({ day: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), count: counts.get(ds) ?? 0 })
    }
    return result
  }, [solved])

  const diffData = useMemo(() => {
    const easy   = { total: questions.filter(q => q.difficulty === 'easy').length,   solved: solved.filter(q => q.difficulty === 'easy').length }
    const medium = { total: questions.filter(q => q.difficulty === 'medium').length, solved: solved.filter(q => q.difficulty === 'medium').length }
    const hard   = { total: questions.filter(q => q.difficulty === 'hard').length,   solved: solved.filter(q => q.difficulty === 'hard').length }
    return [
      { name: 'Easy',   value: easy.solved,   total: easy.total,   fill: '#8BC49A' },
      { name: 'Medium', value: medium.solved, total: medium.total, fill: '#D4848A' },
      { name: 'Hard',   value: hard.solved,   total: hard.total,   fill: '#2C2C2C' },
    ].filter(d => d.total > 0)
  }, [questions, solved])

  const topicsDone = topics.filter(t => t.status === 'done').length
  const topicsInProgress = topics.filter(t => t.status === 'in_progress').length

  const monthAgo = new Date(); monthAgo.setDate(monthAgo.getDate() - 30)
  const twoMonthsAgo = new Date(); twoMonthsAgo.setDate(twoMonthsAgo.getDate() - 60)
  const thisMonth = solved.filter(q => q.updated_at && new Date(q.updated_at) >= monthAgo).length
  const lastMonth = solved.filter(q => {
    if (!q.updated_at) return false
    const d = new Date(q.updated_at)
    return d >= twoMonthsAgo && d < monthAgo
  }).length
  const monthDiff = thisMonth - lastMonth

  const hoursCompleted = topics.reduce((s, t) => s + (t.completed_hours ?? 0), 0)
  const hoursTotal     = topics.reduce((s, t) => s + (t.total_hours ?? 0), 0)

  const STAT_CARDS = [
    { label: 'Problems Solved', value: solved.length, sub: `${attempted.length} attempted`, subColor: 'text-blue-500' },
    { label: 'Acceptance Rate', value: `${acceptanceRate}%`, sub: monthDiff >= 0 ? `+${monthDiff} vs last month` : `${monthDiff} vs last month`, subColor: acceptanceRate >= 60 ? 'text-sage' : 'text-rose' },
    { label: 'Avg Time / Problem', value: avgTime > 0 ? `${avgTime}m` : '—', sub: 'per solved problem', subColor: 'text-text-light' },
    { label: 'Study Streak', value: `${streak}d`, sub: streak > 0 ? '🔥 Keep going!' : 'Start today!', subColor: streak > 0 ? 'text-rose' : 'text-text-light' },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-display text-lg text-text-dark">Analytics</p>
          <p className="text-sm text-text-mid">Track. Analyze. Improve.</p>
        </div>
        <span className="text-xs text-text-light bg-card border border-border px-3 py-1.5 rounded-lg">
          {topics.length} topics · {questions.length} problems
        </span>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {STAT_CARDS.map(s => (
          <div key={s.label} className="bg-card rounded-card border border-border p-4">
            <p className="font-display text-2xl text-text-dark">{s.value}</p>
            <p className="text-xs text-text-mid mt-0.5">{s.label}</p>
            <p className={`text-[10px] mt-1 ${s.subColor}`}>{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 bg-card rounded-card border border-border p-4">
          <p className="font-display text-sm text-text-dark mb-1">Problems Solved (Last 30 Days)</p>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4848A" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#D4848A" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0E4DC" />
              <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#B0B0B0' }} tickLine={false} axisLine={false} interval={6} />
              <YAxis tick={{ fontSize: 9, fill: '#B0B0B0' }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 11, border: '1px solid #F0E4DC', borderRadius: 8, background: '#fff' }} />
              <Area type="monotone" dataKey="count" stroke="#D4848A" strokeWidth={2} fill="url(#grad)" name="Solved" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-card border border-border p-4">
          <p className="font-display text-sm text-text-dark mb-1">By Difficulty</p>
          {diffData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={diffData} cx="50%" cy="50%" innerRadius={48} outerRadius={68} dataKey="value" paddingAngle={3}>
                    {diffData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    <Label
                      content={({ viewBox }) => {
                        const vb = viewBox as { cx?: number; cy?: number }
                        const cx = vb?.cx ?? 0; const cy = vb?.cy ?? 0
                        return (
                          <>
                            <text x={cx} y={cy - 4} textAnchor="middle" fill="#2C2C2C" fontSize={18} fontFamily="Playfair Display, serif" fontWeight="bold">{solved.length}</text>
                            <text x={cx} y={cy + 13} textAnchor="middle" fill="#B0B0B0" fontSize={10}>solved</text>
                          </>
                        )
                      }}
                      position="center"
                    />
                  </Pie>
                  <Tooltip formatter={(v, n) => [`${v}`, String(n)]} contentStyle={{ fontSize: 11, border: '1px solid #F0E4DC', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {diffData.map(d => (
                  <div key={d.name} className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.fill }} />
                    <span className="text-text-mid flex-1">{d.name}</span>
                    <span className="text-text-dark tabular-nums">{d.value}/{d.total}</span>
                    <span className="text-text-light tabular-nums">{d.total > 0 ? Math.round((d.value / d.total) * 100) : 0}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-xs text-text-light italic py-8 text-center">Add problems to see breakdown</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="bg-card rounded-card border border-border p-4">
          <p className="font-display text-sm text-text-dark mb-3">Topics Overview</p>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="font-display text-xl text-sage">{topicsDone}</p>
              <p className="text-xs text-text-light mt-0.5">Completed</p>
            </div>
            <div>
              <p className="font-display text-xl text-amber-500">{topicsInProgress}</p>
              <p className="text-xs text-text-light mt-0.5">In Progress</p>
            </div>
            <div>
              <p className="font-display text-xl text-text-light">{topics.filter(t => !t.status || t.status === 'not_started').length}</p>
              <p className="text-xs text-text-light mt-0.5">Not Started</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-card border border-border p-4">
          <p className="font-display text-sm text-text-dark mb-3">Study Hours</p>
          <div className="flex items-end gap-2 mb-2">
            <p className="font-display text-3xl text-rose">{hoursCompleted}</p>
            <p className="text-sm text-text-light mb-1">/ {hoursTotal}h total</p>
          </div>
          {hoursTotal > 0 && (
            <div className="w-full bg-rose-bg rounded-full h-2">
              <div className="bg-rose h-2 rounded-full transition-all" style={{ width: `${Math.min(100, Math.round((hoursCompleted / hoursTotal) * 100))}%` }} />
            </div>
          )}
          <p className="text-[10px] text-text-light mt-1.5">{hoursTotal > 0 ? Math.round((hoursCompleted / hoursTotal) * 100) : 0}% completed</p>
        </div>
      </div>
    </div>
  )
}
