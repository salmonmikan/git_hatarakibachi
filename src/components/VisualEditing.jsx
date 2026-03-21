import { useEffect } from 'react';
import { VisualEditing } from '@sanity/visual-editing/react-router';
import { useLocation, useNavigate } from 'react-router-dom';

export default function VisualEditingComponent() {
  const navigate = useNavigate();
  const location = useLocation();

  // プレビューモード（URLに preview=true がある場合など）の時だけコンポーネントを有効にする
  const isPreview = location.search.includes('preview=true');

  if (!isPreview) return null;

  return (
    <VisualEditing
      refresh={() => window.location.reload()}
      history={{
        subscribe: (update) => {
          // Sanity Studio からのナビゲーション命令を React Router に反映
          if (update.type === 'push' || update.type === 'replace') {
            navigate(update.url, { replace: update.type === 'replace' });
          }
        },
        update: (update) => {
          // React Router のナビゲーションを Sanity Studio に通知
          // (自動的に反映されることが多いですが、必要に応じて記述)
        }
      }}
    />
  );
}
