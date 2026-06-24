import { localDateStr } from '../../../../lib/utils'
import { useState, useEffect } from 'react'
import { useDebounce } from '../../../../hooks/useDebounce'
import {
  useGratitudeLogs, useAddGratitudeLog, useUpdateGratitudeLog,
  type GratitudeLog,
} from '../../../../hooks/usePersonal'

type Props = { workspaceId: string }

function today() { return localDateStr() }

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

export default function GratitudeTab({ workspaceId: _workspaceId }: Props) {
  const [selectedDate, setSelectedDate] = useState(today())
  const [things, setThings] = useState<[string, string, string]>(['', '', ''])
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')

  const { data: logs = [] } = useGratitudeLogs()
  const addLog = useAddGratitudeLog()
  const updateLog = useUpdateGratitudeLog()

  const debouncedThings = useDebounce(things, 500)

  const existing = logs.find(l => l.log_date === selectedDate) ?? null

  useEffect(() => {
    setThings([
      existing?.thing_1 ?? '',
      existing?.thing_2 ?? '',
      existing?.thing_3 ?? '',
    ])
  }, [selectedDate, logs.length])

  useEffect(() => {
    if (debouncedThings.every(t => t === '')) return
    setSaveState('saving')
    if (existing) {
      updateLog.mutate({ id: existing.id, thing_1: debouncedThings[0], thing_2: debouncedThings[1], thing_3: debouncedThings[2] })
    } else {
      addLog.mutate({ log_date: selectedDate, thing_1: debouncedThings[0], thing_2: debouncedThings[1], thing_3: debouncedThings[2] })
    }
    const t = setTimeout(() => setSaveState('saved'), 800)
    return () => clearTimeout(t)
  }, [debouncedThings])

  const past = logs.filter(l => l.log_date !== selectedDate).slice(0, 30)

  return (
    <div className="p-5 flex flex-col gap-6">
      {/* Date picker + form */}
      <div className="bg-card rounded-card border border-border p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-text-mid">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="border border-border rounded-lg px-3 py-1.5 text-sm bg-card outline-none focus:border-rose"
            />
          </div>
          <span className="text-[11px] text-text-light">
            {saveState === 'saving' ? 'Saving...' : saveState === 'saved' ? 'Saved ✓' : ''}
          </span>
        </div>

        <p className="text-xs text-text-light font-medium uppercase tracking-wide">
          What are you grateful for today?
        </p>

        {(['Thing 1', 'Thing 2', 'Thing 3'] as const).map((label, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-rose font-display font-semibold text-sm w-16 shrink-0">{label}</span>
            <input
              value={things[i]}
              onChange={e => {
                const next: [string, string, string] = [...things] as [string, string, string]
                next[i] = e.target.value
                setThings(next)
                setSaveState('saving')
              }}
              placeholder={`I'm grateful for...`}
              className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-card outline-none focus:border-rose"
            />
          </div>
        ))}
      </div>

      {/* History */}
      {past.length > 0 && (
        <div>
          <h3 className="font-display text-sm font-semibold text-text-dark mb-3">History</h3>
          <div className="flex flex-col gap-3">
            {past.map((log: GratitudeLog) => (
              <div key={log.id} className="bg-card rounded-card border border-border p-4">
                <p className="text-[11px] text-text-light font-medium mb-2">{fmtDate(log.log_date)}</p>
                <div className="flex flex-col gap-1">
                  {[log.thing_1, log.thing_2, log.thing_3].filter(Boolean).map((t, i) => (
                    <p key={i} className="text-sm text-text-dark">
                      <span className="text-rose mr-2">•</span>{t}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
