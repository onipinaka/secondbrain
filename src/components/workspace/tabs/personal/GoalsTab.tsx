import { useState } from 'react'
import { Target, Calendar, Star, MoreVertical, Plus, Check, GripVertical, Trash2, X , List, Gift,Goal} from 'lucide-react'
import {
  usePersonalGoals, useAddPersonalGoal, useUpdatePersonalGoal, useDeletePersonalGoal,
  useWishlistItems, useAddWishlistItem, useUpdateWishlistItem, useDeleteWishlistItem,
  type PersonalGoal,
} from '../../../../hooks/usePersonal'

type FilterKey = 'all' | 'active' | 'short_term' | 'long_term' | 'life_goals' | 'annual' | 'bucket_list' | 'wishlist'

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'short_term', label: 'Short Term' },
  { key: 'long_term', label: 'Long Term' },
  { key: 'life_goals', label: 'Life Goals' },
  { key: 'annual', label: 'Annual' },
  { key: 'bucket_list', label: 'Bucket List' },
  { key: 'wishlist', label: 'Wishlist' },
]

const GOAL_TYPE_OPTIONS = [
  { value: 'life_goal', label: 'Life Goal' },
  { value: 'short_term', label: 'Short Term' },
  { value: 'long_term', label: 'Long Term' },
  { value: 'annual', label: 'Annual' },
]

const STATUS_OPTIONS = [
  { value: 'not_started', label: 'Not Started', dot: 'bg-gray-400', text: 'text-gray-500' },
  { value: 'in_progress', label: 'In Progress', dot: 'bg-blue-500', text: 'text-blue-600' },
  { value: 'active', label: 'Active', dot: 'bg-green-500', text: 'text-green-600' },
  { value: 'achieved', label: 'Achieved', dot: 'bg-rose', text: 'text-rose' },
  { value: 'dropped', label: 'Dropped', dot: 'bg-gray-300', text: 'text-gray-400' },
]

const TYPE_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  short_term: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Short Term' },
  long_term: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Long Term' },
  life_goal: { bg: 'bg-rose-100', text: 'text-rose-600', label: 'Life Goal' },
  annual: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Annual' },
  bucket_list: { bg: 'bg-green-100', text: 'text-green-700', label: 'Bucket List' },
}

const PRIORITY_BADGE: Record<string, { bg: string; text: string }> = {
  high: { bg: 'bg-red-100', text: 'text-red-700' },
  medium: { bg: 'bg-amber-100', text: 'text-amber-700' },
  low: { bg: 'bg-green-100', text: 'text-green-700' },
}

function dueDateLabel(targetDate: string | null): string | null {
  if (!targetDate) return null
  const diff = Math.ceil((new Date(targetDate).getTime() - Date.now()) / 86400000)
  if (diff < 0) return 'Overdue'
  if (diff === 0) return 'Due today'
  if (diff <= 90) return `Due in ${diff} days`
  if (diff <= 365) return `Due in ${Math.round(diff / 30)} months`
  return `Due in ${(diff / 365).toFixed(1)} years`
}

function StatusBadge({ status }: { status: string | null }) {
  const cfg = STATUS_OPTIONS.find(s => s.value === status) ?? STATUS_OPTIONS[0]
  return (
    <span className="flex items-center gap-1 text-xs">
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      <span className={cfg.text}>{cfg.label}</span>
    </span>
  )
}

type GoalForm = {
  goal_type: string
  title: string
  emoji: string
  why_it_matters: string
  status: string
  target_date: string
}

const DEFAULT_GOAL_FORM: GoalForm = {
  goal_type: 'short_term',
  title: '',
  emoji: '',
  why_it_matters: '',
  status: 'not_started',
  target_date: '',
}

type WishlistForm = { title: string; price: string; priority: string; image_url: string }
const DEFAULT_WISHLIST_FORM: WishlistForm = { title: '', price: '', priority: 'medium', image_url: '' }

type Props = { workspaceId: string }

export default function GoalsTab({ workspaceId: _workspaceId }: Props) {
  const [filter, setFilter] = useState<FilterKey>('all')
  const [showAddGoal, setShowAddGoal] = useState(false)
  const [goalForm, setGoalForm] = useState<GoalForm>(DEFAULT_GOAL_FORM)
  const [newBucketTitle, setNewBucketTitle] = useState('')
  const [addingBucket, setAddingBucket] = useState(false)
  const [showAddWishlist, setShowAddWishlist] = useState(false)
  const [wishlistForm, setWishlistForm] = useState<WishlistForm>(DEFAULT_WISHLIST_FORM)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)

  const { data: goals = [], isLoading } = usePersonalGoals()
  const { data: wishlist = [], isLoading: wLoading } = useWishlistItems()
  const addGoal = useAddPersonalGoal()
  const updateGoal = useUpdatePersonalGoal()
  const deleteGoal = useDeletePersonalGoal()
  const addWishlist = useAddWishlistItem()
  const updateWishlist = useUpdateWishlistItem()
  const deleteWishlist = useDeleteWishlistItem()

  const showLifeGoals = filter === 'all' || filter === 'life_goals' || filter === 'active'
  const showRegular = filter === 'all' || filter === 'active' || filter === 'short_term' || filter === 'long_term' || filter === 'annual'
  const showBucket = filter === 'all' || filter === 'bucket_list'
  const showWishlistSection = filter === 'all' || filter === 'wishlist'

  function filterGoal(g: PersonalGoal, types: string[]): boolean {
    if (!types.includes(g.goal_type)) return false
    if (filter === 'active') return g.status === 'active' || g.status === 'in_progress'
    if (filter === 'short_term') return g.goal_type === 'short_term'
    if (filter === 'long_term') return g.goal_type === 'long_term'
    if (filter === 'annual') return g.goal_type === 'annual'
    if (filter === 'life_goals') return g.goal_type === 'life_goal'
    return true
  }

  const lifeGoals = goals.filter(g => filterGoal(g, ['life_goal']))
  const regularGoals = goals.filter(g => filterGoal(g, ['short_term', 'long_term', 'annual']))
  const bucketItems = goals.filter(g => g.goal_type === 'bucket_list')

  function handleAddGoal() {
    if (!goalForm.title.trim()) return
    const payload: Record<string, unknown> = {
      goal_type: goalForm.goal_type,
      title: goalForm.title,
      status: goalForm.status,
    }
    if (goalForm.emoji) payload.emoji = goalForm.emoji
    if (goalForm.why_it_matters) payload.why_it_matters = goalForm.why_it_matters
    if (goalForm.target_date) payload.target_date = goalForm.target_date
    addGoal.mutate(payload as any, {
      onSuccess: () => { setShowAddGoal(false); setGoalForm(DEFAULT_GOAL_FORM) },
    })
  }

  function handleAddBucket() {
    if (!newBucketTitle.trim()) return
    addGoal.mutate({ goal_type: 'bucket_list', title: newBucketTitle, status: 'not_started' } as any, {
      onSuccess: () => { setNewBucketTitle(''); setAddingBucket(false) },
    })
  }

  function handleAddWishlist() {
    if (!wishlistForm.title.trim()) return
    const payload: Record<string, unknown> = {
      title: wishlistForm.title,
      priority: wishlistForm.priority,
      status: 'wished',
    }
    if (wishlistForm.price) payload.price = parseFloat(wishlistForm.price)
    if (wishlistForm.image_url) payload.image_url = wishlistForm.image_url
    addWishlist.mutate(payload as any, {
      onSuccess: () => { setShowAddWishlist(false); setWishlistForm(DEFAULT_WISHLIST_FORM) },
    })
  }

  if (isLoading || wLoading) {
    return <div className="p-8 text-text-mid text-sm">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Page header */}
      <div className="bg-card border-b border-border px-8 py-5 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <Target size={22} className="text-rose" />
            <h1 className="font-display text-2xl text-text-dark">Goals</h1>
          </div>
          <p className="text-sm text-text-mid mt-0.5 ml-8">Turn dreams into plans. Plans into reality.</p>
        </div>
        <button
          onClick={() => setShowAddGoal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-rose text-white rounded-lg text-sm font-medium hover:bg-rose/90 transition-colors"
        >
          <Plus size={15} />
          Add Goal
        </button>
      </div>

      {/* Filter pills */}
      <div className="px-8 py-3.5 flex items-center gap-2 flex-wrap border-b border-border bg-card/60">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`text-xs px-4 py-1.5 rounded-full border transition-colors ${
              filter === f.key
                ? 'bg-rose text-white border-rose'
                : 'bg-white text-text-mid border-border hover:border-rose/40'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="px-8 py-7 flex flex-col gap-10">
        {/* Life Goals */}
        {showLifeGoals && lifeGoals.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-5">
              <Target size={17} className="text-rose" />
              <h2 className="font-display text-lg text-text-dark">Life Goals</h2>
            </div>
            <div className="grid grid-cols-3 gap-5">
              {lifeGoals.map(goal => (
                <div key={goal.id} className="bg-white rounded-2xl border border-rose/25 p-6 relative group flex flex-col items-center text-center">
                  <button className="absolute top-4 right-4 text-gray-200 hover:text-amber-400 transition-colors">
                    <Star size={15} />
                  </button>
                  <div className="w-16 h-16 bg-rose-bg/50 rounded-full flex items-center justify-center text-3xl mb-4">
                    {goal.emoji || '🌟'}
                  </div>
                  <h3 className="font-display text-xl text-text-dark leading-snug mb-3">{goal.title}</h3>
                  {goal.why_it_matters && (
                    <>
                      <hr className="w-full border-border mb-3" />
                      <p className="text-xs text-text-mid text-left">
                        <span className="font-semibold text-text-dark italic">Why it matters: </span>
                        {goal.why_it_matters}
                      </p>
                    </>
                  )}
                  <button
                    onClick={() => deleteGoal.mutate(goal.id)}
                    className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-400"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Short & Long Term Goals */}
        {showRegular && regularGoals.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-5">
              <Target size={17} className="text-rose" />
              <h2 className="font-display text-lg text-text-dark">Short & Long Term Goals</h2>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {regularGoals.map(goal => {
                const typeBadge = TYPE_BADGE[goal.goal_type] ?? TYPE_BADGE.short_term
                const dueLabel = dueDateLabel(goal.target_date)
                return (
                  <div key={goal.id} className="bg-white rounded-xl border border-border p-4 relative group flex flex-col gap-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="w-8 h-8 bg-rose-bg/30 rounded-lg flex items-center justify-center text-base shrink-0">
                          {goal.emoji || '🎯'}
                        </div>
                        <span className="font-semibold text-text-dark text-sm leading-snug line-clamp-2">{goal.title}</span>
                      </div>
                      <div className="relative shrink-0">
                        <button
                          onClick={() => setMenuOpenId(menuOpenId === goal.id ? null : goal.id)}
                          className="text-gray-300 hover:text-text-mid transition-colors p-0.5"
                        >
                          <MoreVertical size={14} />
                        </button>
                        {menuOpenId === goal.id && (
                          <div className="absolute right-0 top-6 bg-white border border-border rounded-lg shadow-lg z-10 min-w-28 py-1">
                            <button
                              onClick={() => { deleteGoal.mutate(goal.id); setMenuOpenId(null) }}
                              className="flex items-center gap-2 px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 w-full"
                            >
                              <Trash2 size={11} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${typeBadge.bg} ${typeBadge.text}`}>
                        {typeBadge.label}
                      </span>
                      <StatusBadge status={goal.status} />
                    </div>

                    {goal.why_it_matters && (
                      <p className="text-xs text-text-mid line-clamp-2">{goal.why_it_matters}</p>
                    )}

                    {dueLabel && (
                      <div className="flex items-center gap-1.5 text-xs text-text-mid mt-auto pt-1">
                        <Calendar size={11} />
                        <span>{dueLabel}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Bucket List */}
        {showBucket && (
          <section>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <span className="text-xl"><List/></span>
                <h2 className="font-display text-lg text-text-dark">Bucket List</h2>
              </div>
              <button
                onClick={() => setAddingBucket(true)}
                className="flex items-center gap-1 text-xs px-3 py-1.5 border border-rose/40 text-rose rounded-lg hover:bg-rose-bg/30 transition-colors"
              >
                <Plus size={12} /> Add to Bucket List
              </button>
            </div>
            <div className="bg-white rounded-xl border border-border overflow-hidden">
              {bucketItems.map(item => (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0 group">
                  <GripVertical size={14} className="text-gray-300 shrink-0 cursor-grab" />
                  <button
                    onClick={() => updateGoal.mutate({ id: item.id, status: item.status === 'achieved' ? 'not_started' : 'achieved' })}
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                      item.status === 'achieved' ? 'bg-rose border-rose' : 'border-gray-300 hover:border-rose'
                    }`}
                  >
                    {item.status === 'achieved' && <Check size={10} className="text-white" />}
                  </button>
                  <span className={`flex-1 text-sm ${item.status === 'achieved' ? 'line-through text-gray-400' : 'text-text-dark'}`}>
                    {item.title}
                  </span>
                  <span className={`text-xs shrink-0 ${item.target_date ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                    {item.target_date
                      ? new Date(item.target_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                      : 'No deadline'}
                  </span>
                  <button
                    onClick={() => deleteGoal.mutate(item.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all shrink-0"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}

              {bucketItems.length === 0 && !addingBucket && (
                <div className="py-8 text-center text-sm text-text-mid">No bucket list items yet.</div>
              )}

              {addingBucket && (
                <div className="flex items-center gap-2 px-4 py-3 border-t border-border">
                  <input
                    autoFocus
                    value={newBucketTitle}
                    onChange={e => setNewBucketTitle(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleAddBucket()
                      if (e.key === 'Escape') { setAddingBucket(false); setNewBucketTitle('') }
                    }}
                    placeholder="Add bucket list item..."
                    className="flex-1 text-sm outline-none text-text-dark placeholder:text-gray-400"
                  />
                  <button onClick={handleAddBucket} className="text-xs text-rose font-medium hover:opacity-70">Add</button>
                  <button onClick={() => { setAddingBucket(false); setNewBucketTitle('') }} className="text-xs text-gray-400 hover:opacity-70">Cancel</button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Wishlist */}
        {showWishlistSection && (
          <section>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <span className="text-xl"><Gift/></span>
                <h2 className="font-display text-lg text-text-dark">Wishlist</h2>
              </div>
              <button
                onClick={() => setShowAddWishlist(true)}
                className="flex items-center gap-1 text-xs px-3 py-1.5 border border-rose/40 text-rose rounded-lg hover:bg-rose-bg/30 transition-colors"
              >
                <Plus size={12} /> Add to Wishlist
              </button>
            </div>
            <div className="bg-white rounded-xl border border-border overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-gray-50/60">
                    <th className="text-left text-xs text-text-mid font-medium px-4 py-3">Item</th>
                    <th className="text-left text-xs text-text-mid font-medium px-4 py-3">Est. Price</th>
                    <th className="text-left text-xs text-text-mid font-medium px-4 py-3">Priority</th>
                    <th className="text-left text-xs text-text-mid font-medium px-4 py-3">Already have</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {wishlist.map(item => {
                    const pBadge = PRIORITY_BADGE[item.priority ?? 'low'] ?? PRIORITY_BADGE.low
                    const alreadyHave = item.already_have ?? false
                    return (
                      <tr key={item.id} className="border-b border-border last:border-0 group hover:bg-gray-50/40 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {item.image_url ? (
                              <img src={item.image_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
                            ) : (
                              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-base">🛍️</div>
                            )}
                            <span className="text-sm text-text-dark font-medium">{item.title}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-text-dark">
                          {item.price != null ? `$${item.price.toLocaleString()}` : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2.5 py-0.5 rounded font-medium ${pBadge.bg} ${pBadge.text}`}>
                            {(item.priority ?? 'low').charAt(0).toUpperCase() + (item.priority ?? 'low').slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => updateWishlist.mutate({ id: item.id, already_have: !alreadyHave })}
                            className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${alreadyHave ? 'bg-rose' : 'bg-gray-200'}`}
                          >
                            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${alreadyHave ? 'translate-x-4' : 'translate-x-0.5'}`} />
                          </button>
                        </td>
                        <td className="px-2 py-3">
                          <button
                            onClick={() => deleteWishlist.mutate(item.id)}
                            className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                  {wishlist.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-sm text-text-mid">No wishlist items yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Empty state */}
        {goals.length === 0 && wishlist.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-3"><Goal/></div>
            <p className="text-text-mid text-sm">No goals yet. Click "+ Add Goal" to get started.</p>
          </div>
        )}
      </div>

      {/* Add Goal Modal */}
      {showAddGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowAddGoal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-xl text-text-dark">Add Goal</h3>
              <button onClick={() => setShowAddGoal(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-medium text-text-mid mb-1 block">Type</label>
                <select
                  value={goalForm.goal_type}
                  onChange={e => setGoalForm(f => ({ ...f, goal_type: e.target.value }))}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm text-text-dark outline-none focus:border-rose"
                >
                  {GOAL_TYPE_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs font-medium text-text-mid mb-1 block">Title</label>
                  <input
                    autoFocus
                    value={goalForm.title}
                    onChange={e => setGoalForm(f => ({ ...f, title: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && handleAddGoal()}
                    placeholder="Goal title..."
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-rose"
                  />
                </div>
                <div className="w-20">
                  <label className="text-xs font-medium text-text-mid mb-1 block">Emoji</label>
                  <input
                    value={goalForm.emoji}
                    onChange={e => setGoalForm(f => ({ ...f, emoji: e.target.value }))}
                    placeholder="🎯"
                    maxLength={2}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm text-center outline-none focus:border-rose"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-text-mid mb-1 block">Why it matters</label>
                <textarea
                  value={goalForm.why_it_matters}
                  onChange={e => setGoalForm(f => ({ ...f, why_it_matters: e.target.value }))}
                  placeholder="Why does this goal matter to you?"
                  rows={2}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-rose resize-none"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs font-medium text-text-mid mb-1 block">Status</label>
                  <select
                    value={goalForm.status}
                    onChange={e => setGoalForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-rose"
                  >
                    {STATUS_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-xs font-medium text-text-mid mb-1 block">Target Date</label>
                  <input
                    type="date"
                    value={goalForm.target_date}
                    onChange={e => setGoalForm(f => ({ ...f, target_date: e.target.value }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-rose"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowAddGoal(false); setGoalForm(DEFAULT_GOAL_FORM) }}
                className="text-sm text-text-mid hover:text-text-dark px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleAddGoal}
                disabled={!goalForm.title.trim() || addGoal.isPending}
                className="bg-rose text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-rose/90 disabled:opacity-50 transition-colors"
              >
                Add Goal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Wishlist Modal */}
      {showAddWishlist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowAddWishlist(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-xl text-text-dark">Add to Wishlist</h3>
              <button onClick={() => setShowAddWishlist(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-medium text-text-mid mb-1 block">Item name</label>
                <input
                  autoFocus
                  value={wishlistForm.title}
                  onChange={e => setWishlistForm(f => ({ ...f, title: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && handleAddWishlist()}
                  placeholder="Item name..."
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-rose"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs font-medium text-text-mid mb-1 block">Est. Price ($)</label>
                  <input
                    type="number"
                    value={wishlistForm.price}
                    onChange={e => setWishlistForm(f => ({ ...f, price: e.target.value }))}
                    placeholder="0"
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-rose"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-medium text-text-mid mb-1 block">Priority</label>
                  <select
                    value={wishlistForm.priority}
                    onChange={e => setWishlistForm(f => ({ ...f, priority: e.target.value }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-rose"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-text-mid mb-1 block">Image URL (optional)</label>
                <input
                  value={wishlistForm.image_url}
                  onChange={e => setWishlistForm(f => ({ ...f, image_url: e.target.value }))}
                  placeholder="https://..."
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-rose"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddWishlist(false)}
                className="text-sm text-text-mid hover:text-text-dark px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleAddWishlist}
                disabled={!wishlistForm.title.trim() || addWishlist.isPending}
                className="bg-rose text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-rose/90 disabled:opacity-50 transition-colors"
              >
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close dropdown on outside click */}
      {menuOpenId && (
        <div className="fixed inset-0 z-0" onClick={() => setMenuOpenId(null)} />
      )}
    </div>
  )
}
