import { defineConfig, isDev } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { presentationTool } from 'sanity/presentation'
import { schemaTypes } from './schemaTypes'

const projectId = 'pz9uficf'
const previewSecret = process.env.SANITY_STUDIO_PREVIEW_SECRET ?? ''

// Common presentation tool logic
const createPresentationPlugin = (baseUrl: string) =>
  presentationTool({
    resolve: {
      locations: {
        post: {
          select: { title: 'title', slug: 'slug.current' },
          resolve: (doc) => doc?.slug ? { locations: [{ title: doc.title || 'Post', href: `/post/${doc.slug}` }] } : null,
        },
        featuredArticles: {
          select: { title: 'title' },
          resolve: (doc) => ({ locations: [{ title: doc?.title || 'Home', href: '/' }] }),
        },
        performance: {
          select: { title: 'title', slug: 'slug.current' },
          resolve: (doc) =>
            doc?.slug
              ? { locations: [{ title: doc.title || 'Performance', href: `/performance/${doc.slug}` }] }
              : null,
        },
        news: {
          select: { title: 'title', slug: 'slug.current' },
          resolve: (doc) =>
            doc?.slug ? { locations: [{ title: doc.title || 'News', href: `/news/${doc.slug}` }] } : null,
        },
      },
    },
    previewUrl: {
      initial: baseUrl,
      previewMode: {
        enable: `/api/draft?secret=${encodeURIComponent(previewSecret)}`,
        disable: '/api/disable-draft',
      },
    },
  })

const commonPlugins = [
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
          S.documentTypeListItem('performance'),
          S.documentTypeListItem('news'),
          S.documentTypeListItem('post'),
          S.documentTypeListItem('author'),
          S.documentTypeListItem('category'),
        ]),
  }),
  visionTool(),
]

const productionWorkspace = {
  name: 'production',
  title: 'hatarakibachi [Production]',
  basePath: '/production',
  projectId,
  dataset: 'production',
  plugins: [
    ...commonPlugins,
    createPresentationPlugin('https://hatarakibachi.com')
  ],
  schema: { types: schemaTypes },
}

const stagingWorkspace = {
  name: 'staging',
  title: 'hatarakibachi [Staging]',
  basePath: '/staging',
  projectId,
  dataset: 'staging',
  plugins: [
    ...commonPlugins,
    createPresentationPlugin(isDev ? 'http://localhost:8788' : 'https://staging.hatarakibachi.com')
  ],
  schema: { types: schemaTypes },
}

const isStagingEnvironment =
  isDev ||
  (typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === 'staging.hatarakibachi.com'))

export default defineConfig(
  isStagingEnvironment ? [stagingWorkspace, productionWorkspace] : [productionWorkspace, stagingWorkspace]
)
