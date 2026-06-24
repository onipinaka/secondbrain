import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Check } from 'lucide-react'
import { useProject } from '../hooks/useProjects'
import { useRoadmapPhase } from '../hooks/useProjects'
import BlockEditor from '../components/shared/BlockEditor'

const STATUS_DOT: Record<string, string> = {
  planned:     'bg-gray-300',
  in_progress: 'bg-blue-500',
  completed:   'bg-green-500',
  skipped:     'bg-gray-200',
}

const STATUS_LABEL: Record<string, string> = {
  planned:     'Planned',
  in_progress: 'In Progress',
  completed:   'Completed',
  skipped:     'Skipped',
}

export default function PhaseNotesPage() {
  const { projectId, phaseId } = useParams<{ projectId: string; phaseId: string }>()
  const navigate = useNavigate()

  const { data: project, isLoading: projLoading } = useProject(projectId ?? '')
  const { data: phase, isLoading: phaseLoading } = useRoadmapPhase(phaseId ?? '')

  const isLoading = projLoading || phaseLoading

  if (isLoading) {
    return (
      <div className="p-8 flex flex-col gap-4 animate-pulse">
        <div className="h-4 bg-rose-bg/40 rounded w-48" />
        <div className="h-7 bg-rose-bg/40 rounded w-72 mt-2" />
        <div className="h-2 bg-rose-bg/40 rounded w-full mt-6" />
        <div className="h-2 bg-rose-bg/40 rounded w-5/6" />
      </div>
    )
  }

  if (!phase || !project) {
    return <div className="p-8 text-text-light text-sm">Phase not found.</div>
  }

  const statusDot = STATUS_DOT[phase.status] ?? 'bg-gray-300'
  const statusLabel = STATUS_LABEL[phase.status] ?? phase.status
  const isCompleted = phase.status === 'completed'

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="px-6 pt-5 pb-4 border-b border-border bg-card flex-shrink-0">
        {/* Breadcrumb */}
        <button
          onClick={() => navigate(`/projects/${projectId}`, { state: { tab: 'Roadmap' } })}
          className="flex items-center gap-1.5 text-text-light hover:text-text-dark text-xs mb-4 transition-colors"
        >
          <ArrowLeft size={13} />
          {project.name} / Roadmap
        </button>

        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center shrink-0 ${isCompleted ? 'border-green-400 bg-green-50' : 'border-border bg-rose-bg/30'}`}>
            {isCompleted ? (
              <Check size={16} className="text-green-500" />
            ) : (
              <span className="text-sm font-bold text-text-mid">P</span>
            )}
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-text-dark leading-tight">{phase.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex items-center gap-1.5 text-[10px] font-medium`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
                <span className="text-text-mid">{statusLabel}</span>
              </span>
              {phase.target_date && (
                <>
                  <span className="text-text-light text-[10px]">·</span>
                  <span className="text-[10px] text-text-light">
                    Target: {new Date(phase.target_date + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </>
              )}
            </div>
            {phase.description && (
              <p className="text-text-light text-xs mt-1.5 max-w-xl">{phase.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-auto min-h-0">
        <BlockEditor
          entityType="proj_phase"
          entityId={String(phase.id)}
          workspaceId={String(projectId)}
          placeholder="Write notes for this phase — implementation details, decisions, references..."
        />
      </div>
    </div>
  )
}
