import { useMemo, useState } from 'react'
import { Code2, ExternalLink, Plus, GitPullRequest, Bug, Package, Search } from 'lucide-react'
import {
  useRepos, useIssues, usePullRequests, useAddRepo,
} from '../../../hooks/useOpenSource'
import { safeUrl } from '../../../lib/utils'

type Props = { onTabChange: (key: string) => void }

const REPO_STATUS: Record<string, { label: string; cls: string }> = {
  exploring:    { label: 'Exploring',    cls: 'bg-gray-100 text-gray-600' },
  contributing: { label: 'Contributing', cls: 'bg-green-100 text-green-700' },
  paused:       { label: 'Paused',       cls: 'bg-amber-100 text-amber-600' },
  done:         { label: 'Done',         cls: 'bg-blue-100 text-blue-600' },
}

const ISSUE_STATUS_CLS: Record<string, string> = {
  open:        'bg-blue-100 text-blue-600',
  assigned:    'bg-purple-100 text-purple-600',
  in_progress: 'bg-amber-100 text-amber-700',
  solved:      'bg-green-100 text-green-700',
  abandoned:   'bg-gray-100 text-gray-400',
}

const PR_STATUS_CLS: Record<string, string> = {
  draft:  'bg-gray-100 text-gray-500',
  open:   'bg-blue-100 text-blue-600',
  merged: 'bg-green-100 text-green-700',
  closed: 'bg-red-100 text-red-500',
}

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-green-100 text-green-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
]

function RepoAvatar({ name }: { name: string }) {
  const idx = (name.charCodeAt(0) ?? 0) % AVATAR_COLORS.length
  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-display font-bold text-sm flex-shrink-0 ${AVATAR_COLORS[idx]}`}>
      {name[0]?.toUpperCase() ?? '?'}
    </div>
  )
}

const EMPTY_FORM = { repo_name: '', github_link: '', owner: '', theme: '', description: '' }

export default function OpenSourceOverview({ onTabChange }: Props) {
  const { data: repos = [], isLoading: reposLoading } = useRepos()
  const { data: issues = [] } = useIssues()
  const { data: prs = [] } = usePullRequests()
  const addRepo = useAddRepo()

  const [form, setForm] = useState(EMPTY_FORM)

  const stats = useMemo(() => ({
    repos: repos.length,
    activeIssues: issues.filter(i => !['solved', 'abandoned'].includes(i.status ?? '')).length,
    openPRs: prs.filter(p => ['draft', 'open'].includes(p.status ?? '')).length,
    mergedPRs: prs.filter(p => p.status === 'merged').length,
  }), [repos, issues, prs])

  const repoStats = useMemo(() => {
    const map: Record<number, { prs: number; merged: number; openIssues: number }> = {}
    for (const r of repos) map[r.id] = { prs: 0, merged: 0, openIssues: 0 }
    for (const p of prs) {
      if (map[p.repo_id]) {
        map[p.repo_id].prs++
        if (p.status === 'merged') map[p.repo_id].merged++
      }
    }
    for (const i of issues) {
      if (map[i.repo_id] && !['solved', 'abandoned'].includes(i.status ?? '')) {
        map[i.repo_id].openIssues++
      }
    }
    return map
  }, [repos, prs, issues])

  const activeIssues = useMemo(
    () => issues.filter(i => !['solved', 'abandoned'].includes(i.status ?? '')).slice(0, 5),
    [issues]
  )

  const openPRs = useMemo(
    () => prs.filter(p => ['draft', 'open'].includes(p.status ?? '')).slice(0, 5),
    [prs]
  )

  function handleAddRepo() {
    if (!form.repo_name.trim()) return
    addRepo.mutate(
      {
        repo_name: form.repo_name.trim(),
        github_link: form.github_link || null,
        owner: form.owner || null,
        theme: form.theme || null,
        description: form.description || null,
      },
      { onSuccess: () => setForm(EMPTY_FORM) }
    )
  }

  return (
    <div className="min-h-full bg-background">
      {/* Hero */}
      <div className="px-8 pt-8 pb-6 border-b border-border bg-card">
        <div className="flex items-center gap-3 mb-1">
          <Code2 size={26} className="text-rose" />
          <h1 className="font-display text-3xl text-text-dark">
            Open Source <span className="text-rose">&lt;/&gt;</span>
          </h1>
        </div>
        <p className="text-text-mid text-sm pl-1 mb-6">Contribute. Learn. Build in public.</p>

        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-4">
          {[
            {
              Icon: Package, label: 'Tracked Repositories', val: stats.repos,
              sub: `${repos.filter(r => r.status === 'contributing').length} actively contributing`,
              color: 'text-green-600',
            },
            {
              Icon: Bug, label: 'Active Issues', val: stats.activeIssues,
              sub: `${issues.filter(i => i.status === 'in_progress').length} in progress`,
              color: 'text-amber-600',
            },
            {
              Icon: GitPullRequest, label: 'Open PRs', val: stats.openPRs,
              sub: `${prs.filter(p => p.status === 'open').length} awaiting review`,
              color: 'text-blue-600',
            },
            {
              Icon: Code2, label: 'Merged PRs', val: stats.mergedPRs,
              sub: 'Total merged',
              color: 'text-green-600',
            },
          ].map(s => (
            <div key={s.label} className="border border-border rounded-card p-4 flex items-center gap-3 bg-background">
              <div className="w-10 h-10 rounded-xl bg-rose-bg/60 flex items-center justify-center flex-shrink-0">
                <s.Icon size={18} className="text-rose" />
              </div>
              <div>
                <p className="text-[11px] text-text-mid">{s.label}</p>
                <p className={`font-display text-2xl leading-tight ${s.color}`}>{s.val}</p>
                <p className="text-[10px] text-text-light">{s.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Repos + Add Form */}
      <div className="grid grid-cols-[1fr_320px] border-b border-border">
        {/* Repo list */}
        <div className="p-6 border-r border-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-base text-text-dark">Repositories</h2>
              <p className="text-xs text-text-mid">Repositories you're tracking or contributing to.</p>
            </div>
          </div>

          {reposLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-rose-bg/30 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : repos.length === 0 ? (
            <div className="py-12 text-center text-text-light text-sm">No repos yet. Add one →</div>
          ) : (
            <div className="space-y-3">
              {repos.slice(0, 4).map(repo => {
                const rs = repoStats[repo.id] ?? { prs: 0, merged: 0, openIssues: 0 }
                const s = REPO_STATUS[repo.status ?? ''] ?? { label: repo.status ?? '—', cls: 'bg-gray-100 text-gray-500' }
                return (
                  <div key={repo.id} className="border border-border rounded-xl p-4 hover:bg-rose-bg/10 transition-colors">
                    <div className="flex items-start gap-3">
                      <RepoAvatar name={repo.repo_name} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-text-dark text-sm">{repo.repo_name}</span>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${s.cls}`}>{s.label}</span>
                        </div>
                        {repo.owner && (
                          <p className="text-[11px] text-text-mid mt-0.5">{repo.owner} / {repo.repo_name}</p>
                        )}
                        <div className="flex items-center gap-4 mt-1.5 text-[11px] text-text-mid">
                          <span>Theme: <span className="text-text-dark">{repo.theme ?? '—'}</span></span>
                          <span>Stack: <span className="text-text-dark">{repo.tech_stack?.slice(0, 2).join(', ') ?? '—'}</span></span>
                        </div>
                        <div className="flex items-center gap-5 mt-2">
                          {[
                            { label: 'PRs', val: rs.prs },
                            { label: 'Merged', val: rs.merged },
                            { label: 'Open', val: rs.openIssues },
                          ].map(c => (
                            <div key={c.label} className="text-center">
                              <p className="text-xs font-medium text-text-dark">{c.val}</p>
                              <p className="text-[10px] text-text-light">{c.label}</p>
                            </div>
                          ))}
                          <div className="ml-auto flex items-center gap-3 text-[11px]">
                            {repo.github_link && (
                              <a
                                href={safeUrl(repo.github_link)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-text-mid hover:text-rose transition-colors"
                              >
                                <ExternalLink size={11} /> Open Repo
                              </a>
                            )}
                            <button
                              onClick={() => onTabChange('repos')}
                              className="text-rose hover:underline"
                            >
                              View Details →
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {repos.length > 4 && (
            <button
              onClick={() => onTabChange('repos')}
              className="mt-3 text-rose text-sm hover:underline"
            >
              View all repositories →
            </button>
          )}
        </div>

        {/* Add Repo form */}
        <div className="p-6 bg-rose-bg/5">
          <h2 className="font-display text-base text-text-dark mb-0.5">Add Repository</h2>
          <p className="text-xs text-text-mid mb-4">Track a new repository to get started.</p>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-text-mid font-medium mb-1">
                Repo Name <span className="text-rose">*</span>
              </label>
              <input
                value={form.repo_name}
                onChange={e => setForm(f => ({ ...f, repo_name: e.target.value }))}
                placeholder="e.g. Next.js"
                className="w-full text-sm bg-card border border-border rounded-lg px-3 py-2 outline-none focus:border-rose"
              />
            </div>
            <div>
              <label className="block text-xs text-text-mid font-medium mb-1">GitHub Link</label>
              <input
                value={form.github_link}
                onChange={e => setForm(f => ({ ...f, github_link: e.target.value }))}
                placeholder="e.g. https://github.com/vercel/next.js"
                className="w-full text-sm bg-card border border-border rounded-lg px-3 py-2 outline-none focus:border-rose"
              />
            </div>
            <div>
              <label className="block text-xs text-text-mid font-medium mb-1">Owner / Org</label>
              <input
                value={form.owner}
                onChange={e => setForm(f => ({ ...f, owner: e.target.value }))}
                placeholder="e.g. vercel"
                className="w-full text-sm bg-card border border-border rounded-lg px-3 py-2 outline-none focus:border-rose"
              />
            </div>
            <div>
              <label className="block text-xs text-text-mid font-medium mb-1">Theme / Domain</label>
              <input
                value={form.theme}
                onChange={e => setForm(f => ({ ...f, theme: e.target.value }))}
                placeholder="e.g. devtools / ai / web"
                className="w-full text-sm bg-card border border-border rounded-lg px-3 py-2 outline-none focus:border-rose"
              />
            </div>
            <div>
              <label className="block text-xs text-text-mid font-medium mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="What do you want to learn or contribute?"
                rows={3}
                className="w-full resize-none text-sm bg-card border border-border rounded-lg px-3 py-2 outline-none focus:border-rose"
              />
            </div>
            <button
              onClick={handleAddRepo}
              disabled={!form.repo_name.trim() || addRepo.isPending}
              className="w-full flex items-center justify-center gap-2 bg-rose text-white text-sm py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              <Plus size={14} /> Add Repository
            </button>
          </div>
        </div>
      </div>

      {/* Active Issues + Open PRs */}
      <div className="grid grid-cols-2 border-b border-border">
        {/* Active Issues */}
        <div className="p-6 border-r border-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-base text-text-dark">Active Issues</h2>
              <p className="text-xs text-text-mid">Issues you've claimed and are working on.</p>
            </div>
            <button onClick={() => onTabChange('issues')} className="text-rose text-xs hover:underline">
              View All →
            </button>
          </div>
          {activeIssues.length === 0 ? (
            <p className="text-text-light text-sm text-center py-8">No active issues.</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-3 text-text-mid font-medium">Issue</th>
                  <th className="text-left py-2 pr-3 text-text-mid font-medium">Repo</th>
                  <th className="text-left py-2 text-text-mid font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {activeIssues.map(issue => (
                  <tr key={issue.id} className="border-b border-border/50 hover:bg-rose-bg/10">
                    <td className="py-2 pr-3">
                      <span className="text-text-dark font-medium line-clamp-1">{issue.title}</span>
                      {issue.issue_number != null && (
                        <span className="text-text-light ml-1">#{issue.issue_number}</span>
                      )}
                    </td>
                    <td className="py-2 pr-3 text-text-mid whitespace-nowrap">
                      {issue.os_repos?.repo_name ?? '—'}
                    </td>
                    <td className="py-2">
                      <span className={`inline-block px-1.5 py-0.5 rounded-full font-medium text-[10px] capitalize ${ISSUE_STATUS_CLS[issue.status ?? ''] ?? 'bg-gray-100 text-gray-500'}`}>
                        {issue.status?.replace('_', ' ') ?? '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Open PRs */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-base text-text-dark">Open PRs</h2>
              <p className="text-xs text-text-mid">Pull requests you've opened.</p>
            </div>
            <button onClick={() => onTabChange('pull_requests')} className="text-rose text-xs hover:underline">
              View All →
            </button>
          </div>
          {openPRs.length === 0 ? (
            <p className="text-text-light text-sm text-center py-8">No open PRs.</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-3 text-text-mid font-medium">PR</th>
                  <th className="text-left py-2 pr-3 text-text-mid font-medium">Repo</th>
                  <th className="text-left py-2 pr-3 text-text-mid font-medium">Status</th>
                  <th className="text-left py-2 text-text-mid font-medium">Opened</th>
                </tr>
              </thead>
              <tbody>
                {openPRs.map(pr => (
                  <tr key={pr.id} className="border-b border-border/50 hover:bg-rose-bg/10">
                    <td className="py-2 pr-3">
                      <span className="text-text-dark font-medium line-clamp-1">{pr.title}</span>
                      {pr.pr_number != null && (
                        <span className="text-text-light ml-1">#{pr.pr_number}</span>
                      )}
                    </td>
                    <td className="py-2 pr-3 text-text-mid whitespace-nowrap">
                      {pr.os_repos?.repo_name ?? '—'}
                    </td>
                    <td className="py-2 pr-3">
                      <span className={`inline-block px-1.5 py-0.5 rounded-full font-medium text-[10px] ${PR_STATUS_CLS[pr.status ?? ''] ?? 'bg-gray-100 text-gray-500'}`}>
                        {pr.status ?? '—'}
                      </span>
                    </td>
                    <td className="py-2 text-text-mid whitespace-nowrap">
                      {pr.opened_at
                        ? new Date(pr.opened_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-6">
        <h2 className="font-display text-base text-text-dark mb-4">Quick Actions</h2>
        <div className="grid grid-cols-4 gap-3">
          {[
            { Icon: Plus,          label: 'Add Repository',  sub: 'Track a new repo',         action: () => onTabChange('repos') },
            { Icon: Search,        label: 'Find Issues',     sub: 'Browse open issues',        action: () => onTabChange('issues') },
            { Icon: GitPullRequest, label: 'Create PR',      sub: 'Open a pull request',       action: () => onTabChange('pull_requests') },
            { Icon: Package,       label: 'View Repos',      sub: 'All tracked repositories',  action: () => onTabChange('repos') },
          ].map(a => (
            <button
              key={a.label}
              onClick={a.action}
              className="border border-border rounded-card p-4 text-left hover:bg-rose-bg/20 hover:border-rose/30 transition-colors"
            >
              <a.Icon size={18} className="text-rose mb-2" />
              <p className="text-sm font-medium text-text-dark">{a.label}</p>
              <p className="text-[11px] text-text-mid mt-0.5">{a.sub}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
