import BlockEditor from '../../shared/BlockEditor'

type Props = { workspaceId: string }

export default function LanguageNotesTab({ workspaceId }: Props) {
  return (
    <div className="p-6">
      <BlockEditor
        entityType="workspace"
        entityId={workspaceId}
        workspaceId={workspaceId}
        placeholder="Start writing notes..."
      />
    </div>
  )
}
