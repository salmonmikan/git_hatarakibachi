import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {presentationTool} from 'sanity/presentation'
import {schemaTypes} from './schemaTypes'

const isStagingStudio =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === 'staging.hatarakibachi.com')
const previewOrigin = isStagingStudio ? 'http://localhost:8788' : 'https://hatarakibachi.com'
const previewSecret = process.env.SANITY_STUDIO_PREVIEW_SECRET ?? ''

export default defineConfig({
  name: 'default',
  title: `hatarakibachi [${isStagingStudio ? 'staging' : 'production'}]`,

  projectId: 'pz9uficf',
  dataset: isStagingStudio ? 'staging' : 'production',

  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('コンテンツ')
          .id('root')
          .items([
            S.listItem()
              .title('トップページ情報')
              .id('featuredArticles')
              .child(
                S.document()
                  .schemaType('featuredArticles')
                  .documentId('featuredArticles')
              ),
            S.divider(),
            ...S.documentTypeListItems().filter(
              (listItem) => !['featuredArticles'].includes(listItem.getId())
            ),
          ]),
    }),
    presentationTool({
      resolve: {
        locations: {
          post: {
            select: {title: 'title', slug: 'slug.current'},
            resolve: (doc) => {
              if (!doc?.slug) return null

              return {
                locations: [
                  {
                    title: doc.title || 'Post',
                    href: `/post/${doc.slug}`,
                  },
                ],
              }
            },
          },
          featuredArticles: {
            select: {title: 'title'},
            resolve: (doc) => ({
              locations: [
                {
                  title: doc?.title || 'Home',
                  href: '/',
                },
              ],
            }),
          },
          performance: {
            select: {title: 'title'},
            resolve: (doc) => ({
              locations: [
                {
                  title: doc?.title || 'Home',
                  href: '/',
                },
              ],
            }),
          },
        },
      },
      previewUrl: {
        initial: previewOrigin,
        previewMode: {
          enable: `/api/draft?secret=${encodeURIComponent(previewSecret)}`,
          disable: '/api/disable-draft',
        },
      },
    }),
    visionTool(),
  ],

  schema: {
    types: schemaTypes,
  },
})