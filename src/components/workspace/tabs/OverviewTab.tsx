import { useMemo, useState } from 'react'
import { PieChart, Pie, Cell, Label, ResponsiveContainer, Tooltip } from 'recharts'
import {
  Brain, BookOpen, Code2, Link2, MessageSquare, RefreshCw, ScrollText, BarChart2, PenLine,
  Flame, CheckCircle2, Shuffle, Search, Calendar, Target, Quote, Pencil, Check, X,
  TrendingUp, Pin,
} from 'lucide-react'
import { useCsTopics, useCsQuestions, useCsDailyConfig, useUpsertCsDailyConfig } from '../../../hooks/useCoreSubject'
import { useQuotes } from '../../../hooks/usePersonal'
import type { Workspace } from '../../../hooks/useWorkspace'

type Props = {
  workspace: Workspace
  coreSubjectId: number | null
  onTabChange?: (tabKey: string) => void
}

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

const CS_TABS = [
  { key: 'overview',     label: 'Overview',      Icon: Brain },
  { key: 'topics',       label: 'Topics',        Icon: BookOpen },
  { key: 'problems',     label: 'Problems',      Icon: Code2 },
  { key: 'resources',    label: 'Resources',     Icon: Link2 },
  { key: 'interview_qa', label: 'Interview Q&A', Icon: MessageSquare },
  { key: 'revision',     label: 'Revision',      Icon: RefreshCw },
  { key: 'cheat_sheets', label: 'Cheat Sheets',  Icon: ScrollText },
  { key: 'analytics',    label: 'Analytics',     Icon: BarChart2 },
  { key: 'notes',        label: 'Notes',         Icon: PenLine },
]

const FALLBACK_QUOTE = { quote: 'Consistency is the real superpower.', author: 'Unknown' }

export default function OverviewTab({ workspace, coreSubjectId, onTabChange }: Props) {
  const { data: topics = [] } = useCsTopics(coreSubjectId)
  const { data: questions = [] } = useCsQuestions(coreSubjectId)
  const { data: config } = useCsDailyConfig(coreSubjectId)
  const { data: quotes = [] } = useQuotes()
  const upsertConfig = useUpsertCsDailyConfig()

  const [editingGoal, setEditingGoal] = useState(false)
  const [goalInput, setGoalInput] = useState('')

  const dailyGoal = config?.questions_daily_goal ?? 3
  const todayStr = toDateStr(new Date())

  const solved = useMemo(() => questions.filter(q => q.status === 'solved'), [questions])
  const solvedToday = useMemo(() => solved.filter(q => q.updated_at && toDateStr(new Date(q.updated_at)) === todayStr).length, [solved, todayStr])
  const topicsCompleted = useMemo(() => topics.filter(t => t.status === 'done').length, [topics])
  const streak = useMemo(() => {
    const dates = new Set(solved.map(q => q.updated_at?.split('T')[0]).filter(Boolean) as string[])
    return computeStreak(dates)
  }, [solved])

  const topicChartData = useMemo(() => [
    { name: 'Completed', value: topics.filter(t => t.status === 'done').length, fill: '#8BC49A' },
    { name: 'In Progress', value: topics.filter(t => t.status === 'in_progress').length, fill: '#D4848A' },
    { name: 'Not Started', value: topics.filter(t => !t.status || t.status === 'not_started').length, fill: '#E8E0D8' },
  ].filter(d => d.value > 0), [topics])

  const diffChartData = useMemo(() => [
    { name: 'Easy', value: questions.filter(q => q.difficulty === 'easy').length, fill: '#8BC49A' },
    { name: 'Medium', value: questions.filter(q => q.difficulty === 'medium').length, fill: '#D4848A' },
    { name: 'Hard', value: questions.filter(q => q.difficulty === 'hard').length, fill: '#4A4A4A' },
  ].filter(d => d.value > 0), [questions])

  const weakTopics = useMemo(() => {
    return topics
      .filter(t => t.status !== 'done')
      .map(t => {
        const qs = questions.filter(q => q.topic_id === t.topic_id)
        const s = qs.filter(q => q.status === 'solved').length
        const pct = qs.length > 0 ? Math.round((s / qs.length) * 100) : 0
        return { ...t, pct, total: qs.length }
      })
      .filter(t => t.total > 0)
      .sort((a, b) => a.pct - b.pct)
      .slice(0, 3)
  }, [topics, questions])

  const recentSolved = useMemo(() => solved
    .sort((a, b) => (b.updated_at ?? '').localeCompare(a.updated_at ?? ''))
    .slice(0, 5), [solved])

  const motivationQuote = useMemo(() => {
    if (quotes.length === 0) return FALLBACK_QUOTE
    return quotes[new Date().getDate() % quotes.length]
  }, [quotes])

  const DIFF_CLS: Record<string, string> = {
    easy: 'text-sage', medium: 'text-amber-600', hard: 'text-rose',
  }

  const solvedPct = questions.length > 0 ? Math.round((solved.length / questions.length) * 100) : 0
  const topicsPct = topics.length > 0 ? Math.round((topicsCompleted / topics.length) * 100) : 0

  function startEditGoal() {
    setGoalInput(String(dailyGoal))
    setEditingGoal(true)
  }

  function saveGoal() {
    const val = parseInt(goalInput, 10)
    if (!isNaN(val) && val > 0 && coreSubjectId && coreSubjectId > 0) {
      upsertConfig.mutate({ core_subject_id: coreSubjectId, questions_daily_goal: val })
    }
    setEditingGoal(false)
  }

  function cancelGoal() {
    setEditingGoal(false)
  }

  return (
    <div className="p-6 space-y-5">

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-bg flex items-center justify-center shrink-0">
            <Brain size={20} className="text-rose" />
          </div>
          <div>
            <h1 className="font-display text-2xl text-text-dark leading-tight">{workspace.name}</h1>
            {workspace.description && (
              <p className="text-xs text-text-light mt-0.5">{workspace.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {streak > 0 && (
            <div className="flex items-center gap-1.5 bg-rose-bg/50 text-rose px-3 py-1.5 rounded-full border border-rose/20">
              <Flame size={13} />
              <span className="text-xs font-medium">{streak} day streak</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 bg-card border border-border px-3 py-1.5 rounded-full">
            <TrendingUp size={13} className="text-text-light" />
            <span className="text-xs text-text-mid font-medium">{solved.length} / {questions.length} solved</span>
          </div>
        </div>
      </div>

      {/* ── Tab Quick Nav ────────────────────────────────────────────────────── */}
      {workspace.category === 'core_subject' && (
        <div className="grid grid-cols-9 gap-2">
          {CS_TABS.map(tab => {
            const Icon = tab.Icon
            return (
              <button
                key={tab.key}
                onClick={() => onTabChange?.(tab.key)}
                className="bg-card rounded-card border border-border p-3 flex flex-col items-center gap-1.5 hover:border-rose hover:bg-rose-bg/20 transition-colors group cursor-pointer"
              >
                <Icon size={16} className="text-text-light group-hover:text-rose transition-colors" />
                <span className="text-[9px] text-text-mid group-hover:text-rose text-center leading-tight font-medium">
                  {tab.label}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* ── Row 1: Today's Goal + Progress Overview + Quick Actions ──────────── */}
      <div className="grid grid-cols-3 gap-4">

        {/* Today's Goal */}
        <div className="bg-card rounded-card border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] text-text-light uppercase tracking-wide">Today's Goal</p>
            {!editingGoal ? (
              <button
                onClick={startEditGoal}
                className="text-text-light hover:text-rose transition-colors"
                title="Edit daily goal"
              >
                <Pencil size={12} />
              </button>
            ) : (
              <div className="flex items-center gap-1">
                <button onClick={saveGoal} className="text-sage hover:text-sage/80 transition-colors">
                  <Check size={13} />
                </button>
                <button onClick={cancelGoal} className="text-text-light hover:text-rose transition-colors">
                  <X size={13} />
                </button>
              </div>
            )}
          </div>

          {editingGoal ? (
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-text-mid">Solve</span>
              <input
                type="number"
                min={1}
                max={50}
                value={goalInput}
                onChange={e => setGoalInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveGoal(); if (e.key === 'Escape') cancelGoal() }}
                autoFocus
                className="w-14 border border-rose rounded-lg px-2 py-1 text-sm text-text-dark bg-transparent outline-none text-center font-semibold"
              />
              <span className="text-sm text-text-mid">problems</span>
            </div>
          ) : (
            <p className="font-display text-base text-text-dark leading-snug mb-4">
              Solve <span className="text-rose font-semibold">{dailyGoal}</span> problems today.
            </p>
          )}

          <div className="h-1.5 bg-border rounded-full mb-2">
            <div
              className="h-full bg-rose rounded-full transition-all"
              style={{ width: `${Math.min((solvedToday / dailyGoal) * 100, 100)}%` }}
            />
          </div>
          <p className="text-xs text-text-mid font-medium">
            {solvedToday} / {dailyGoal} completed
          </p>
        </div>

        {/* Progress Overview */}
        <div className="bg-card rounded-card border border-border p-5">
          <p className="text-[10px] text-text-light uppercase tracking-wide mb-4">Progress Overview</p>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-[11px] text-text-mid">
                  <Pin size={11} className="text-text-light shrink-0" />
                  <span>Problems Solved</span>
                  <span className="font-semibold text-text-dark">{solved.length}</span>
                </div>
                <span className="text-[11px] font-semibold text-text-dark">{solvedPct}%</span>
              </div>
              <div className="h-1.5 bg-border rounded-full">
                <div className="h-full bg-rose rounded-full transition-all" style={{ width: `${solvedPct}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-[11px] text-text-mid">
                  <BookOpen size={11} className="text-text-light shrink-0" />
                  <span>Topics Completed</span>
                  <span className="font-semibold text-text-dark">{topicsCompleted}/{topics.length}</span>
                </div>
                <span className="text-[11px] font-semibold text-text-dark">{topicsPct}%</span>
              </div>
              <div className="h-1.5 bg-border rounded-full">
                <div className="h-full bg-sage rounded-full transition-all" style={{ width: `${topicsPct}%` }} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] text-text-mid">
                <Flame size={11} className="text-rose shrink-0" />
                <span>Current Streak</span>
              </div>
              <span className="text-[11px] font-semibold text-rose">{streak} days</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-card rounded-card border border-border p-5">
          <p className="text-[10px] text-text-light uppercase tracking-wide mb-3">Quick Actions</p>
          <div className="space-y-1.5">
            {[
              { Icon: Shuffle,  label: 'Random Problem',    tab: 'problems' },
              { Icon: Search,   label: 'Weak Topic Finder', tab: 'topics' },
              { Icon: Calendar, label: 'Revise Today',      tab: 'revision' },
              { Icon: BarChart2, label: 'View Analytics',   tab: 'analytics' },
            ].map(a => (
              <button
                key={a.label}
                onClick={() => onTabChange?.(a.tab)}
                className="w-full flex items-center gap-2 text-xs text-text-mid hover:text-rose hover:bg-rose-bg/30 px-3 py-2 rounded-lg transition-colors text-left"
              >
                <a.Icon size={13} className="shrink-0" />
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row 2: Topic Progress + Problems by Difficulty + Recent Solved ────── */}
      <div className="grid grid-cols-3 gap-4">

        {/* Topic Progress donut */}
        <div className="bg-card rounded-card border border-border p-5">
          <p className="text-[10px] text-text-light uppercase tracking-wide mb-2">Topic Progress</p>
          {topicChartData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie
                    data={topicChartData}
                    cx="50%" cy="50%"
                    innerRadius={44} outerRadius={62}
                    dataKey="value"
                    paddingAngle={3}
                  >
                    {topicChartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    <Label
                      content={({ viewBox }) => {
                        const vb = viewBox as { cx?: number; cy?: number }
                        const cx = vb?.cx ?? 0; const cy = vb?.cy ?? 0
                        return (
                          <>
                            <text x={cx} y={cy - 4} textAnchor="middle" fill="#2C2C2C" fontSize={18} fontFamily="Playfair Display, serif" fontWeight="bold">{topicsCompleted}</text>
                            <text x={cx} y={cy + 12} textAnchor="middle" fill="#B0B0B0" fontSize={9}>of {topics.length}</text>
                          </>
                        )
                      }}
                      position="center"
                    />
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 11, border: '1px solid #F0E4DC', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-1">
                {topicChartData.map(d => (
                  <div key={d.name} className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.fill }} />
                      <span className="text-text-light">{d.name}</span>
                    </div>
                    <span className="text-text-mid font-medium tabular-nums">
                      {d.value} ({topics.length > 0 ? Math.round((d.value / topics.length) * 100) : 0}%)
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-xs text-text-light italic py-8 text-center">Add topics to see progress</p>
          )}
        </div>

        {/* Problems by Difficulty donut */}
        <div className="bg-card rounded-card border border-border p-5">
          <p className="text-[10px] text-text-light uppercase tracking-wide mb-2">Problems by Difficulty</p>
          {diffChartData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie
                    data={diffChartData}
                    cx="50%" cy="50%"
                    innerRadius={44} outerRadius={62}
                    dataKey="value"
                    paddingAngle={3}
                  >
                    {diffChartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    <Label
                      content={({ viewBox }) => {
                        const vb = viewBox as { cx?: number; cy?: number }
                        const cx = vb?.cx ?? 0; const cy = vb?.cy ?? 0
                        return (
                          <>
                            <text x={cx} y={cy - 4} textAnchor="middle" fill="#2C2C2C" fontSize={18} fontFamily="Playfair Display, serif" fontWeight="bold">{questions.length}</text>
                            <text x={cx} y={cy + 12} textAnchor="middle" fill="#B0B0B0" fontSize={9}>Total</text>
                          </>
                        )
                      }}
                      position="center"
                    />
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 11, border: '1px solid #F0E4DC', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-1">
                {diffChartData.map(d => (
                  <div key={d.name} className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.fill }} />
                      <span className="text-text-light">{d.name}</span>
                    </div>
                    <span className="text-text-mid font-medium tabular-nums">
                      {d.value} ({questions.length > 0 ? Math.round((d.value / questions.length) * 100) : 0}%)
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-xs text-text-light italic py-8 text-center">Add problems to see breakdown</p>
          )}
        </div>

        {/* Recent Problems Solved */}
        <div className="bg-card rounded-card border border-border p-5">
          <p className="text-[10px] text-text-light uppercase tracking-wide mb-3">Recent Problems Solved</p>
          {recentSolved.length === 0 ? (
            <p className="text-xs text-text-light italic py-4 text-center">No problems solved yet</p>
          ) : (
            <>
              <div className="space-y-2.5">
                {recentSolved.map(q => (
                  <div key={q.id} className="flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-sage shrink-0" />
                    <span className="text-xs text-text-dark flex-1 truncate">{q.title}</span>
                    {q.difficulty && (
                      <span className={`text-[10px] font-medium shrink-0 ${DIFF_CLS[q.difficulty] ?? 'text-text-light'}`}>
                        {q.difficulty.charAt(0).toUpperCase() + q.difficulty.slice(1)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={() => onTabChange?.('problems')}
                className="text-[10px] text-rose mt-4 hover:underline"
              >
                View All →
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Row 3: Weak Topics + Motivation ─────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4">

        {/* Weak Topics */}
        <div className="bg-card rounded-card border border-border p-5">
          <div className="flex items-center gap-2 mb-3">
            <Flame size={13} className="text-rose shrink-0" />
            <p className="text-[10px] text-text-light uppercase tracking-wide">Weak Topics — Focus Here</p>
          </div>
          {weakTopics.length === 0 ? (
            <p className="text-xs text-text-light italic py-4 text-center">All topics looking good!</p>
          ) : (
            <>
              <div className="space-y-4">
                {weakTopics.map(t => (
                  <div key={t.topic_id}>
                    <div className="flex items-center gap-2 mb-1">
                      <Target size={11} className="text-rose shrink-0" />
                      <span className="text-xs text-text-dark truncate flex-1 font-medium">{t.title}</span>
                      <span className="text-xs text-rose font-semibold shrink-0">{t.pct}%</span>
                    </div>
                    <div className="h-1.5 bg-border rounded-full ml-4">
                      <div className="h-full bg-rose rounded-full transition-all" style={{ width: `${t.pct}%` }} />
                    </div>
                    <p className="text-[9px] text-text-light mt-0.5 ml-4">needs more practice</p>
                  </div>
                ))}
              </div>
              <button
                onClick={() => onTabChange?.('topics')}
                className="text-[10px] text-rose mt-4 hover:underline"
              >
                View Weak Topic Report →
              </button>
            </>
          )}
        </div>

        {/* Motivation — from real quotes table */}
        <div className="bg-rose-bg/40 rounded-card border border-border p-5 relative overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Quote size={13} className="text-rose shrink-0" />
            <p className="text-[10px] text-text-light uppercase tracking-wide">Motivation</p>
          </div>
          <Quote size={48} className="text-rose/15 absolute top-4 right-4 select-none pointer-events-none" />
          <p className="font-display text-sm text-text-dark leading-relaxed italic flex-1">
            {motivationQuote.quote}
          </p>
          {motivationQuote.author && (
            <p className="text-[10px] text-text-light mt-3">— {motivationQuote.author}</p>
          )}
        </div>
      </div>
    </div>
  )
}
