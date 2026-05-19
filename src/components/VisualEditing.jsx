import { lazy, Suspense } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { canUsePreviewMode } from '@src/utils/previewMode.js'

const SanityVisualEditing = lazy(() =>
  import('@sanity/visual-editing/react').then((mod) => ({
    default: mod.VisualEditing,
  }))
)

export default function VisualEditingComponent() {
  const navigate = useNavigate()
  useLocation()

  if (!canUsePreviewMode()) return null

  return (
    <Suspense fallback={null}>
      <SanityVisualEditing
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
    </Suspense>
  )
}
