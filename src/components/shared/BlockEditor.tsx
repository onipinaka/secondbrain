import '@blocknote/mantine/style.css'
import { BlockNoteView } from '@blocknote/mantine'
import { type PartialBlock } from '@blocknote/core'
import { useCreateBlockNote } from '@blocknote/react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useDebounce } from '../../hooks/useDebounce'
import { supabase } from '../../lib/supabase'

export interface BlockEditorProps {
  entityType?: string
  entityId?: string
  workspaceId?: string
  placeholder?: string
  className?: string
}

type SavingState = 'idle' | 'saving' | 'saved'

const EDITOR_THEME = {
  colors: {
    editor: { background: '#FFFFFF', text: '#2C2C2C' },
    menu: { background: '#FFFFFF', text: '#2C2C2C' },
    tooltip: { background: '#FEF5EF', text: '#2C2C2C' },
    hovered: { background: '#FDEEE8', text: '#2C2C2C' },
    selected: { background: '#FDDEDE', text: '#2C2C2C' },
    border: '#F0E4DC',
    sideMenu: '#B0B0B0',
  },
  fontFamily: '"Inter", sans-serif',
  borderRadius: 8,
} as const

export default function BlockEditor({
  entityType,
  entityId,
  workspaceId,
  placeholder = 'Start writing...',
  className,
}: BlockEditorProps) {
  const [loading, setLoading] = useState(true)
  const [ready, setReady] = useState(false)
  const [title, setTitle] = useState('')
  const [savingState, setSavingState] = useState<SavingState>('idle')
  const [changeKey, setChangeKey] = useState(0)
  const [initialContent, setInitialContent] = useState<PartialBlock[] | undefined>()

  const noteIdRef = useRef<string | null>(null)
  const titleRef = useRef('')
  const editorRef = useRef<ReturnType<typeof useCreateBlockNote> | null>(null)

  // Re-creates editor once after initialContent is loaded from DB.
  // deps: [ready] transitions false→true after fetch, triggering re-creation with content.
  const editor = useCreateBlockNote(
    {
      initialContent,
      placeholders: { emptyDocument: placeholder, default: placeholder },
    },
    [ready],
  )

  // Keep editorRef current so doSave never has stale closure issues
  editorRef.current = editor

  // Fetch existing note
  useEffect(() => {
    async function fetchNote() {
      if (!entityType || !entityId) {
        setLoading(false)
        setReady(true)
        return
      }

      const { data, error } = await supabase
        .from('note_pages')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .limit(1)
        .maybeSingle()

      if (error) {
        toast.error('Failed to load note')
        setLoading(false)
        setReady(true)
        return
      }

      if (data) {
        noteIdRef.current = data.id
        const loadedTitle = data.title ?? ''
        titleRef.current = loadedTitle
        setTitle(loadedTitle)
        if (data.content) setInitialContent(data.content as PartialBlock[])
      }

      setLoading(false)
      setReady(true)
    }

    fetchNote()
  }, [entityType, entityId])

  // Auto-save: debounced off changeKey
  const debouncedKey = useDebounce(changeKey, 500)

  useEffect(() => {
    if (debouncedKey === 0) return
    doSave()
  }, [debouncedKey]) // eslint-disable-line react-hooks/exhaustive-deps

  async function doSave() {
    if (!editorRef.current) return
    setSavingState('saving')

    const content = editorRef.current.document as unknown as Record<string, unknown>[]
    const savedTitle = titleRef.current

    let saveError: unknown = null

    if (noteIdRef.current) {
      const { error } = await supabase
        .from('note_pages')
        .update({ title: savedTitle, content: content as any, updated_at: new Date().toISOString() })
        .eq('id', noteIdRef.current)
      saveError = error
    } else {
      const { data, error } = await supabase
        .from('note_pages')
        .insert({
          title: savedTitle,
          content: content as any,
          entity_type: entityType ?? null,
          entity_id: entityId ?? null,
          workspace_id: workspaceId ?? null,
        })
        .select('id')
        .single()
      saveError = error
      if (!error && data) noteIdRef.current = data.id
    }

    if (saveError) {
      toast.error('Failed to save note')
      setSavingState('idle')
      return
    }

    setSavingState('saved')
    setTimeout(() => setSavingState('idle'), 2000)
  }

  function triggerChange() {
    setChangeKey(k => k + 1)
  }

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    titleRef.current = e.target.value
    setTitle(e.target.value)
    triggerChange()
  }

  function handleTitleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      editor.focus()
    }
  }

  if (loading) {
    return (
      <div className={`bg-card rounded-card border border-border p-6 w-full ${className ?? ''}`}>
        <div className="h-8 w-48 bg-rose-bg/40 rounded animate-pulse mb-4" />
        <div className="space-y-2">
          {[80, 70, 60, 50].map((w, i) => (
            <div key={i} className="h-4 bg-rose-bg/40 rounded animate-pulse" style={{ width: `${w}%` }} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-card rounded-card border border-border p-6 w-full relative ${className ?? ''}`}>
      <div className="absolute top-4 right-4 text-xs select-none">
        {savingState === 'saving' && <span className="text-text-light">Saving...</span>}
        {savingState === 'saved' && <span className="text-sage transition-opacity">Saved ✓</span>}
      </div>

      <input
        type="text"
        value={title}
        onChange={handleTitleChange}
        onKeyDown={handleTitleKeyDown}
        placeholder="Untitled"
        className="font-display text-2xl text-text-dark font-semibold border-none outline-none bg-transparent w-full mb-4 placeholder:text-text-light focus:ring-0 pr-24"
      />

      <div className="bn-wrapper" style={{ minHeight: 200 }}>
        <BlockNoteView
          editor={editor}
          onChange={triggerChange}
          theme={EDITOR_THEME}
        />
      </div>
    </div>
  )
}
