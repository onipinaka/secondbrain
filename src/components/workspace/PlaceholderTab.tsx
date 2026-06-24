type Props = { tabName: string; workspaceId: string }

export default function PlaceholderTab({ tabName, workspaceId }: Props) {
  return (
    <div className="p-8 text-center text-text-mid">
      <p className="text-4xl mb-3">🚧</p>
      <p className="font-display text-lg text-text-dark">{tabName}</p>
      <p className="text-sm mt-1">Coming in a future phase · workspace: {workspaceId}</p>
    </div>
  )
}
