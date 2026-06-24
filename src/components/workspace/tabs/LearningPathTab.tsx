import BlockEditor from '../../shared/BlockEditor'

type Props = { workspaceId: string }

export default function LearningPathTab({ workspaceId }: Props) {
  return (
    <div className="p-6">
      <div className="mb-4">
        <h2 className="font-display text-lg text-text-dark">Learning Path</h2>
        <p className="text-sm text-text-mid mt-1">Map out the order to learn topics in this workspace.</p>
      </div>
      <BlockEditor
        entityType="learning_path"
        entityId={workspaceId}
        workspaceId={workspaceId}
        placeholder="Start writing your learning path..."
      />
    </div>
  )
}
