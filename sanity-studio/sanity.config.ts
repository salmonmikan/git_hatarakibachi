import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {presentationTool} from 'sanity/presentation'
import {schemaTypes} from './schemaTypes'

export default defineConfig({
  name: 'default',
  title: 'hatarakibachi',

  projectId: 'pz9uficf',
  dataset: 'production',

  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('コンテンツ')
          .id('root')
          .items([
            // Top Page Info Singleton
            S.listItem()
              .title('トップページ情報')
              .id('featuredArticles')
              .child(
                S.document()
                  .schemaType('featuredArticles')
                  .documentId('featuredArticles')
              ),
            S.divider(),
            // Regular items
            ...S.documentTypeListItems().filter(
              (listItem) => !['featuredArticles'].includes(listItem.getId())
            ),
          ]),
    }),
    presentationTool({
      previewUrl: {
        origin: typeof window !== 'undefined' && window.location.hostname === 'localhost' 
          ? 'http://localhost:5173' 
          : 'https://hatarakibachi.pages.dev', // デフォルトの本番/STG URL（必要に応じて変更）
        previewMode: {
          enable: '/api/draft',
        },
      },
    }),
    visionTool(),
  ],

  schema: {
    types: schemaTypes,
  },
})
