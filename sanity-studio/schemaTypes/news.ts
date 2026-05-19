import {defineField, defineType} from 'sanity'

function createNewsSlug() {
  const randomId =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 12)
      : Math.random().toString(36).slice(2, 14)

  return `news-${randomId}`
}

function createInitialNewsValue() {
  const publishedAt = new Date().toISOString()

  return {
    publishedAt,
    status: 'private',
    slug: {current: createNewsSlug()},
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
      description: 'システムで自動生成されます。手動編集はできません。',
      options: {
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
