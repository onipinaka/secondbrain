import { localDateStr } from '../../../../lib/utils'
import { useState, useEffect } from 'react'
import { Plus, Trash2, ExternalLink } from 'lucide-react'
import { type ColumnDef } from '@tanstack/react-table'
import DataTable from '../../../shared/DataTable'
import { useDebounce } from '../../../../hooks/useDebounce'
import {
  useCalisthenicsSkills, useAddCalisthenicsSkill, useUpdateCalisthenicsSkill, useDeleteCalisthenicsSkill,
  useCalisthenicsSessions, useAddCalisthenicsSession, useUpdateCalisthenicsSession, useDeleteCalisthenicsSession,
  type CalisthenicsSkill, type CalisthenicsSession,
} from '../../../../hooks/useGym'

type Props = { workspaceId: string }

function today() { return localDateStr() }

const SESSION_NUM_COLS = new Set(['duration_mins'])

const sessionColumns: ColumnDef<CalisthenicsSession>[] = [
  { accessorKey: 'log_date', header: 'Date', meta: { type: 'date', editable: true } },
  { accessorKey: 'skills_practiced', header: 'Skills Practiced', meta: { type: 'text', editable: true } },
  { accessorKey: 'duration_mins', header: 'Duration (min)', meta: { type: 'number', editable: true } },
  { accessorKey: 'notes', header: 'Notes', meta: { type: 'text', editable: true } },
]

function SkillCard({
  skill,
  onUpdate,
  onDelete,
}: {
  skill: CalisthenicsSkill
  onUpdate: (patch: Partial<CalisthenicsSkill>) => void
  onDelete: () => void
}) {
  const [plan, setPlan] = useState(skill.progression_plan ?? '')
  const [editingSkill, setEditingSkill] = useState(false)
  const [skillVal, setSkillVal] = useState(skill.skill)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')

  useEffect(() => { setPlan(skill.progression_plan ?? '') }, [skill.id])

  const debouncedPlan = useDebounce(plan, 500)

  useEffect(() => {
    if (debouncedPlan === (skill.progression_plan ?? '')) return
    setSaveState('saving')
    onUpdate({ progression_plan: debouncedPlan })
    const t = setTimeout(() => setSaveState('saved'), 800)
    return () => clearTimeout(t)
  }, [debouncedPlan])

  return (
    <div className="bg-card rounded-card border border-border p-4 flex flex-col gap-3 group relative">
      <button
        onClick={onDelete}
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-text-light hover:text-red-400"
      >
        <Trash2 size={14} />
      </button>

      <div>
        {editingSkill ? (
          <input
            autoFocus
            value={skillVal}
            onChange={e => setSkillVal(e.target.value)}
            onBlur={() => { if (skillVal.trim()) onUpdate({ skill: skillVal.trim() }); setEditingSkill(false) }}
            onKeyDown={e => {
              if (e.key === 'Enter') { if (skillVal.trim()) onUpdate({ skill: skillVal.trim() }); setEditingSkill(false) }
              if (e.key === 'Escape') { setSkillVal(skill.skill); setEditingSkill(false) }
            }}
            className="font-display text-base font-semibold text-text-dark bg-transparent border-b border-rose outline-none w-full"
          />
        ) : (
          <h3
            className="font-display text-base font-semibold text-text-dark cursor-text hover:opacity-75"
            onClick={() => setEditingSkill(true)}
          >
            {skill.skill}
          </h3>
        )}

        <div className="flex items-center gap-2 mt-1 text-xs text-text-mid">
          <input
            className="w-20 border border-border rounded px-2 py-0.5 text-xs bg-card outline-none focus:border-rose"
            placeholder="Current level"
            defaultValue={skill.current_level ?? ''}
            onBlur={e => onUpdate({ current_level: e.target.value })}
          />
          <span className="text-text-light">→</span>
          <input
            className="w-20 border border-border rounded px-2 py-0.5 text-xs bg-card outline-none focus:border-rose"
            placeholder="Target level"
            defaultValue={skill.target_level ?? ''}
            onBlur={e => onUpdate({ target_level: e.target.value })}
          />
        </div>
      </div>

      {skill.training_notes !== undefined && (
        <div>
          <p className="text-[10px] text-text-light uppercase tracking-wide font-medium mb-1">Training Notes</p>
          <textarea
            className="w-full border border-border rounded-lg px-3 py-2 text-xs bg-card outline-none focus:border-rose resize-none"
            rows={2}
            placeholder="Training notes..."
            defaultValue={skill.training_notes ?? ''}
            onBlur={e => onUpdate({ training_notes: e.target.value })}
          />
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-1">
          <p className="text-[10px] text-text-light uppercase tracking-wide font-medium">Progression Plan</p>
          <span className="text-[10px] text-text-light">
            {saveState === 'saving' ? 'Saving...' : saveState === 'saved' ? 'Saved ✓' : ''}
          </span>
        </div>
        <textarea
          className="w-full border border-border rounded-lg px-3 py-2 text-xs bg-card outline-none focus:border-rose resize-none"
          rows={3}
          placeholder="Progression plan..."
          value={plan}
          onChange={e => { setPlan(e.target.value); setSaveState('saving') }}
        />
      </div>

      {skill.video_url && (
        <a
          href={skill.video_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-rose hover:underline"
        >
          <ExternalLink size={12} /> Video progress
        </a>
      )}
    </div>
  )
}

export default function CalisthenicsTab({ workspaceId: _workspaceId }: Props) {
  const [showAddSkill, setShowAddSkill] = useState(false)
  const [newSkillName, setNewSkillName] = useState('')

  const { data: skills = [], isLoading: skillsLoading } = useCalisthenicsSkills()
  const { data: sessions = [], isLoading: sessionsLoading } = useCalisthenicsSessions()

  const addSkill = useAddCalisthenicsSkill()
  const updateSkill = useUpdateCalisthenicsSkill()
  const deleteSkill = useDeleteCalisthenicsSkill()

  const addSession = useAddCalisthenicsSession()
  const updateSession = useUpdateCalisthenicsSession()
  const deleteSession = useDeleteCalisthenicsSession()

  function handleAddSkill() {
    if (!newSkillName.trim()) return
    addSkill.mutate(
      { skill: newSkillName.trim() },
      { onSuccess: () => { setNewSkillName(''); setShowAddSkill(false) } },
    )
  }

  return (
    <div className="p-5 flex flex-col gap-8">
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-base font-semibold text-text-dark">Skills</h3>
          {showAddSkill ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={newSkillName}
                onChange={e => setNewSkillName(e.target.value)}
                placeholder="Skill name..."
                className="border border-rose rounded-lg px-3 py-1.5 text-sm bg-card outline-none w-40"
                onKeyDown={e => { if (e.key === 'Enter') handleAddSkill(); if (e.key === 'Escape') setShowAddSkill(false) }}
              />
              <button onClick={handleAddSkill} className="bg-rose text-white text-xs px-3 py-1.5 rounded-lg hover:opacity-90">Add</button>
              <button onClick={() => setShowAddSkill(false)} className="text-xs text-text-mid px-2 py-1.5">Cancel</button>
            </div>
          ) : (
            <button
              onClick={() => setShowAddSkill(true)}
              className="flex items-center gap-1.5 bg-rose text-white text-xs px-3 py-1.5 rounded-lg hover:opacity-90"
            >
              <Plus size={13} /> Add Skill
            </button>
          )}
        </div>

        {skillsLoading ? (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-card rounded-card border border-border p-4 h-40 animate-pulse" />
            ))}
          </div>
        ) : skills.length === 0 ? (
          <div className="text-center py-10 text-text-light text-sm">
            No skills tracked yet. Add your first skill above.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {skills.map(s => (
              <SkillCard
                key={s.id}
                skill={s}
                onUpdate={patch => updateSkill.mutate({ id: s.id, ...patch })}
                onDelete={() => deleteSkill.mutate(s.id)}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="font-display text-base font-semibold text-text-dark mb-4">Sessions Log</h3>
        <div className="bg-card rounded-card border border-border overflow-hidden">
          <DataTable
            data={sessions}
            columns={sessionColumns}
            isLoading={sessionsLoading}
            onRowAdd={() => addSession.mutate({ log_date: today() })}
            onRowUpdate={(rowIndex, columnId, value) => {
              const row = sessions[rowIndex]
              if (!row) return
              const v = SESSION_NUM_COLS.has(columnId) ? (value === '' || value == null ? null : Number(value)) : value
              updateSession.mutate({ id: row.id, [columnId]: v })
            }}
            onRowDelete={rowIndex => deleteSession.mutate(sessions[rowIndex].id)}
            emptyMessage="No sessions logged. Click + to add one."
          />
        </div>
      </section>
    </div>
  )
}
