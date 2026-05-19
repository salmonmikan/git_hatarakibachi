import {defineField, defineType} from 'sanity'

const NEWS_SLUG_API_VERSION = '2023-05-03'

function getDateSlug(publishedAt: unknown) {
  if (typeof publishedAt === 'string' && publishedAt.length >= 10) {
    return publishedAt.slice(0, 10)
  }

  return new Date().toISOString().slice(0, 10)
}

async function buildNewsSlug(
  document: {_id?: string; publishedAt?: string},
  context: {getClient: (options: {apiVersion: string}) => {fetch: <T>(query: string, params?: Record<string, unknown>) => Promise<T>}},
) {
  const dateSlug = getDateSlug(document.publishedAt)
  const baseId = document._id?.replace(/^drafts\./, '') ?? ''
  const draftId = `drafts.${baseId}`
  const publishedId = baseId
  const existingSlugs = await context.getClient({apiVersion: NEWS_SLUG_API_VERSION}).fetch<string[]>(
    `*[
      _type == "news" &&
      defined(slug.current) &&
      slug.current match $pattern &&
      !(_id in [$draftId, $publishedId])
    ].slug.current`,
    {
      pattern: `${dateSlug}-*`,
      draftId,
      publishedId,
    },
  )

  const maxSerial = existingSlugs.reduce((max, slug) => {
    const match = slug.match(new RegExp(`^${dateSlug}-(\\d+)$`))
    if (!match) {
      return max
    }

    return Math.max(max, Number(match[1]))
  }, 0)

  return `${dateSlug}-${String(maxSerial + 1).padStart(2, '0')}`
}

async function createInitialNewsValue(_: undefined, context: {getClient: (options: {apiVersion: string}) => {fetch: <T>(query: string, params?: Record<string, unknown>) => Promise<T>}}) {
  const publishedAt = new Date().toISOString()
  const slug = await buildNewsSlug({publishedAt}, context)

  return {
    publishedAt,
    status: 'private',
    slug: {current: slug},
  }
}

export default defineType({
  name: 'news',
  title: 'News',
  type: 'document',
  initialValue: createInitialNewsValue,
  fields: [
    defineField({
      name: 'title',
      title: 'タイトル',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'URLスラッグ',
      type: 'slug',
      readOnly: true,
      description: '公開日を元に自動生成されます。例: 2023-05-01-01',
      options: {
        source: (document, context) => buildNewsSlug(document, context),
        slugify: (value) => value,
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'publishedAt',
      title: '公開日',
      type: 'datetime',
    }),
    defineField({
      name: 'status',
      title: '公開ステータス',
      type: 'string',
      initialValue: 'private',
      options: {
        list: [
          {title: '公開中', value: 'published'},
          {title: '非公開', value: 'private'},
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'body',
      title: '本文',
      type: 'blockContent',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      status: 'status',
      publishedAt: 'publishedAt',
    },
    prepare(selection) {
      const {title, status, publishedAt} = selection
      const date = publishedAt ? new Date(publishedAt).toLocaleDateString('ja-JP') : '日付未設定'
      return {
        title,
        subtitle: `${status ?? 'private'} / ${date}`,
      }
    },
  },
})
