import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
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
    visionTool(),
  ],

  schema: {
    types: schemaTypes,
  },
})
