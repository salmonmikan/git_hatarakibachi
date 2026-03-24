import { VisualEditing } from '@sanity/visual-editing/react'
import { useLocation, useNavigate } from 'react-router-dom'
import { canUsePreviewMode } from '@src/utils/previewMode.js'

export default function VisualEditingComponent() {
  const navigate = useNavigate()
  useLocation()

  if (!canUsePreviewMode()) return null

  return (
    <VisualEditing
      refresh={() => window.location.reload()}
      history={{
        subscribe: (update) => {
          if (update.type === 'push' || update.type === 'replace') {
            navigate(update.url, { replace: update.type === 'replace' })
          }
        },
        update: () => {},
      }}
    />
  )
}